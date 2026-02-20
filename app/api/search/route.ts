import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const subjectId = searchParams.get("subjectId");
    const transcribedOnly = searchParams.get("transcribed") === "true";

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ recordings: [] });
    }

    // Build query - search in title
    let supabaseQuery = supabase
      .from("recordings")
      .select("id, subject_id, title, duration, date, transcribed")
      .ilike("title", `%${query}%`)
      .order("date", { ascending: false });

    // Apply filters
    if (subjectId) {
      supabaseQuery = supabaseQuery.eq("subject_id", subjectId);
    }

    if (transcribedOnly) {
      supabaseQuery = supabaseQuery.eq("transcribed", true);
    }

    const { data: recordings, error: recordingsError } = await supabaseQuery;

    if (recordingsError) {
      console.error("Error fetching recordings:", recordingsError);
      return NextResponse.json(
        { error: "Failed to search recordings" },
        { status: 500 }
      );
    }

    // Search in transcriptions if query exists
    const { data: transcriptions, error: transcriptionsError } = await supabase
      .from("transcriptions")
      .select("recording_id, text")
      .ilike("text", `%${query}%`);

    if (transcriptionsError) {
      console.error("Error searching transcriptions:", transcriptionsError);
    }

    // Get recording IDs that match in transcription text
    const transcriptionRecordingIds = new Set(
      transcriptions?.map((t) => t.recording_id) || []
    );

    // Fetch recordings that match transcription text
    let transcriptionRecordings: any[] = [];
    if (transcriptionRecordingIds.size > 0) {
      const { data, error } = await supabase
        .from("recordings")
        .select("id, subject_id, title, duration, date, transcribed")
        .in("id", Array.from(transcriptionRecordingIds))
        .order("date", { ascending: false });

      if (!error && data) {
        // Apply filters to transcription results
        transcriptionRecordings = data.filter((rec: any) => {
          if (subjectId && rec.subject_id !== subjectId) return false;
          if (transcribedOnly && !rec.transcribed) return false;
          return true;
        });
      }
    }

    // Combine and deduplicate results
    const recordingIds = new Set(recordings?.map((r) => r.id) || []);
    const combinedRecordings = [
      ...(recordings || []),
      ...transcriptionRecordings.filter((r) => !recordingIds.has(r.id)),
    ];

    // Fetch subject details for all recordings
    const subjectIds = [...new Set(combinedRecordings.map(r => r.subject_id))];
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, icon, color")
      .in("id", subjectIds);

    const subjectsMap = new Map(subjects?.map(s => [s.id, s]) || []);

    // Add match info and subject details
    const results = combinedRecordings.map((rec) => ({
      ...rec,
      subjects: subjectsMap.get(rec.subject_id) || { name: "Unknown", icon: "📖", color: "#9b87f5" },
      matchedInTitle: rec.title.toLowerCase().includes(query.toLowerCase()),
      matchedInTranscription: transcriptionRecordingIds.has(rec.id),
    }));

    return NextResponse.json({ 
      recordings: results,
      query,
      totalResults: results.length 
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
