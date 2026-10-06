import type { Metadata } from "next";
import { ClassroomClient } from "@/components/learning/ClassroomClient";

export const metadata: Metadata = {
  title: "Classroom | QCI",
  description: "Create class playlists and review learner progress backups.",
};

export default function ClassroomPage() {
  return <ClassroomClient />;
}
