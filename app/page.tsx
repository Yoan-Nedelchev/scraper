"use client"; // Add this directive to mark the component as a Client Component

import { useState } from "react";

interface TableRow {
  image: string;
  lnk1: string;
  lnk2: string;
  additionalData: string;
  price: number;
  index: number;
}

export default function Home() {
  const [numberOfPages, setNumberOfPages] = useState<string>("");
  const [rows, setRows] = useState<TableRow[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleClick = () => {
    const fetchData = async () => {
      const encodedURI = encodeURIComponent(inputValue);
      const response = await fetch(`/api/scrape?url=${encodedURI}`);
      const data = await response.json();
      setNumberOfPages(data.numberOfPages || "Unknown");
      setRows(data.rows || []);
    };
    fetchData();
    setInputValue("");
    setNumberOfPages("");
    setRows([]);
  };

  return (
    <div style={{ padding: "40px" }}>
      <div
        className='generalInfoContainer'
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span>Брой страници: {numberOfPages ? numberOfPages : 0}</span>
        <span>Брой записи: {rows.length}</span>
        <div
          style={{
            display: "flex",
            marginBottom: "20px",
          }}
        >
          <input
            type='text'
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder='URL'
            style={{
              borderRadius: "4px",
              marginRight: "10px",
              marginTop: "5px",
              color: "black",
              padding: "5px",
              width: "300px",
            }}
          />
          <button
            onClick={handleClick}
            style={{
              border: "1px solid white",
              padding: "4px 10px",
              borderRadius: "4px",
              alignSelf: "flex-end",
            }}
          >
            Потвърди
          </button>
        </div>
      </div>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid white",
                padding: "8px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              №
            </th>
            <th
              style={{
                border: "1px solid white",
                padding: "8px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Изображение
            </th>
            <th
              style={{
                border: "1px solid white",
                padding: "8px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Цена
            </th>
            <th
              style={{
                border: "1px solid white",
                padding: "8px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Линк 1
            </th>
            <th
              style={{
                border: "1px solid white",
                padding: "8px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Линк 2
            </th>
            <th
              style={{
                border: "1px solid white",
                padding: "8px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Допълнителна информация
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td
                style={{
                  border: "1px solid white",
                  padding: "8px",
                  textAlign: "center",
                }}
                dangerouslySetInnerHTML={{ __html: row.index || "" }}
              />
              <td
                style={{
                  border: "1px solid white",
                  padding: "8px",
                  textAlign: "center",
                }}
                dangerouslySetInnerHTML={{ __html: row.image || "" }}
              />
              <td style={{ border: "1px solid white", padding: "8px" }}>
                {row.price.toLocaleString("en-US", {
                  style: "currency",
                  currency: "EUR",
                })}
              </td>
              <td
                style={{ border: "1px solid white", padding: "8px" }}
                dangerouslySetInnerHTML={{ __html: row.lnk1 }}
              />
              <td
                style={{ border: "1px solid white", padding: "8px" }}
                dangerouslySetInnerHTML={{ __html: row.lnk2 }}
              />
              <td
                style={{ border: "1px solid white", padding: "8px" }}
                dangerouslySetInnerHTML={{ __html: row.additionalData }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
