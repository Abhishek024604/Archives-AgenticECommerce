import React from "react";
function QtySelector({ qty, onChange }) {
  return (
    <select
      value={qty}
      onChange={e => onChange(Number(e.target.value))}
      className="border px-1 bg-gray-200"
    >
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <option key={n} value={n}>Qty: {n}</option>
      ))}
    </select>
  );
}

export default QtySelector;
