export function Pagination({ page, pageSize, total, onChange }:{page:number;pageSize:number;total:number;onChange:(p:number)=>void}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div style={{display:"flex", gap:8}}>
      <button disabled={page<=1} onClick={()=>onChange(page-1)}>Prev</button>
      <span>{page} / {totalPages}</span>
      <button disabled={page>=totalPages} onClick={()=>onChange(page+1)}>Next</button>
    </div>
  );
}
