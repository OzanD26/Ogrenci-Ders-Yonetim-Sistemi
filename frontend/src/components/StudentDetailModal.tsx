import { useEffect, useState } from "react";
import client from "../api/client";

export default function StudentDetailModal({
  id,
  onClose,
}: { id: number; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(`/students/${id}`);
        setData(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!id) return null;
  return (
    <div style={backdrop}>
      <div style={card}>
        <button style={xBtn} onClick={onClose}>✕</button>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <h3>
              {data.firstName} {data.lastName}
            </h3>
            <p>Email: {data.email}</p>
            <p>Enrolled courses:</p>
            <ul>
              {(data.enrollments ?? []).map((en: any) => (
                <li key={en.id}>{en.course?.name}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "grid",
  placeItems: "center",
};
const card: React.CSSProperties = {
  background: "#fff",
  width: 420,
  maxWidth: "90vw",
  padding: 16,
  borderRadius: 12,
  position: "relative",
};
const xBtn: React.CSSProperties = {
  position: "absolute",
  right: 8,
  top: 8,
  border: "none",
  background: "transparent",
  fontSize: 18,
  cursor: "pointer",
};
