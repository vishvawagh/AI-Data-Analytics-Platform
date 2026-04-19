import React from "react";

export default function Dropdown({ value, onChange, label = "Department" }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select department</option>
        <option value="sales">Sales</option>
        <option value="product">Product</option>
        <option value="store">Store</option>
        <option value="head">Head</option>
      </select>
    </label>
  );
}
