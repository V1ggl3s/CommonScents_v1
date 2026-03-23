npx shadcn@latest add https://21st.dev/r/makviesainte/team-showcase

import TeamShowcase from "@/components/ui/team-showcase";

export default function TeamShowcaseDemo() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <TeamShowcase />
    </div>
  );
}
