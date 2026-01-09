"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setReady(true);
    };

    checkSession();
  }, [router]);

  if (!ready) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Lade…</p>
      </main>
    );
  }

  return <>{children}</>;
}