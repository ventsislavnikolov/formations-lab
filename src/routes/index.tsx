import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      params: { formationId: "4-3-3" },
      to: "/formations/$formationId",
    });
  },
});
