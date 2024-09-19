import { NextResponse } from "next/server";
import jsdom from "jsdom";
import iconv from "iconv-lite";
import { createKysely } from "@vercel/postgres-kysely";
import { sql } from "kysely";
import moment from "moment";
import nodemailer from "nodemailer";

interface RoomData {
  date: string;
  image: string;
  lnk1: string;
  lnk2: string;
  subway: string;
  data: string;
  price: string;
}

interface Database {
  two_room_data: RoomData;
  three_room_data: RoomData;
}

type Table = "two_room_data" | "three_room_data";

const db = createKysely<Database>();

const writeInDB = async (rows: RoomData[], table: Table) => {
  await db
    .insertInto(table)
    .values(rows)
    .onConflict((oc) => oc.columns(["data", "price"]).doNothing())
    .execute();
};

const SUBWAY_ARRAY = [
  "младост",
  "дървеница",
  "дианабад",
  "дружба",
  "изгрев",
  "изток",
  "лозенец",
  "хладилника",
  "кръстова",
  "център",
  "зона",
  "разсадника",
  "света троица",
  "люлин",
  "фондови",
  "връбница",
  "надежда",
  "триъгълника",
  "обеля",
  "студентски",
  "сердика",
  "илинден",
  "западен парк",
  "гевгелийски",
  "медицинска академия",
  "красно",
  "овча",
  "хиподрума",
  "лагера",
  "славия",
  "стрелбище",
  "свобода",
  "толстой",
  "хаджи",
  "вазов",
  "яворов",
  "сухата",
  "оборище",
  "подуяне",
  "летище",
  "искър",
  "горна",
  "банишора",
];

// Handling GET requests
export const revalidate = 0;
export async function GET() {
  const resultsTypes = new Set();
  const url = process.env.url1;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.gmailEmail,
      pass: process.env.gmailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  let counter = 1;
  const lastEqualsIndex = url.lastIndexOf("=");

  async function fetchPage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch the page");

    // Get the response as an ArrayBuffer
    const buffer = await response.arrayBuffer();

    // Convert the buffer from windows-1251 to UTF-8
    const html = iconv.decode(Buffer.from(buffer), "windows-1251");

    // Use jsdom to parse the HTML
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract images
    const imageElements = document.querySelectorAll("a.photoLink img");

    // Extract all elements with class "lnk1" and "lnk2"
    const lnk1Elements = document.querySelectorAll("a.lnk1");
    const lnk2Elements = document.querySelectorAll("a.lnk2");

    // Extract additional data from the <td> elements
    const additionalDataElements = document.querySelectorAll("td[width='520']");

    // Extract prices
    const priceElements = document.querySelectorAll("div.price");

    // Extract the number of pages
    const pageNumbersInfo = document.querySelector(".pageNumbersInfo");
    const numberOfPages = pageNumbersInfo
      ? pageNumbersInfo.textContent?.match(/(\d+)$/)?.[1] || "Unknown"
      : "Unknown";

    Array.from(lnk1Elements).forEach((el: HTMLAnchorElement) =>
      resultsTypes.add(el.innerHTML)
    );
    const images = Array.from(imageElements).map((el: HTMLImageElement) => {
      // Get the current href attribute
      const src = el.getAttribute("src");

      // Check if href starts with "//" and prepend "https://"
      if (src && src.startsWith("//")) {
        el.setAttribute("src", `https:${src}`);
      }

      // Return the modified outerHTML
      return el.outerHTML;
    });

    const lnk1Html = Array.from(lnk1Elements).map((el: HTMLAnchorElement) => {
      // Get the current href attribute
      const href = el.getAttribute("href");

      // Check if href starts with "//" and prepend "https://"
      if (href && href.startsWith("//")) {
        el.setAttribute("href", `https:${href}`);
      }

      // Set target="_blank"
      el.setAttribute("target", "_blank");

      // Return the modified outerHTML
      return el.outerHTML;
    });

    const lnk2Html = Array.from(lnk2Elements).map((el: HTMLAnchorElement) => {
      // Get the current href attribute
      const href = el.getAttribute("href");

      // Check if href starts with "//" and prepend "https://"
      if (href && href.startsWith("//")) {
        el.setAttribute("href", `https:${href}`);
      }

      // Set target="_blank"
      el.setAttribute("target", "_blank");

      // Return the modified outerHTML
      return el.outerHTML;
    });

    const additionalDataHtml = Array.from(additionalDataElements).map(
      (el: HTMLBaseElement) => el.innerHTML.trim()
    );
    const prices = Array.from(priceElements).map(
      (el: HTMLBaseElement) =>
        parseFloat(el.textContent.replace(/[^\d.-]/g, "")) || 0
    );

    return {
      images,
      numberOfPages,
      lnk1Html,
      lnk2Html,
      additionalDataHtml,
      prices,
    };
  }

  try {
    const baseUrl = url.substring(0, lastEqualsIndex);
    let currentPage = 1;
    const allData = {
      rows: [],
      numberOfPages: "1",
      resultTypes: [],
    };

    const delay = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const fetchData = async () => {
      while (true) {
        const pageUrl = `${baseUrl}=${currentPage}`;
        const pageData = await fetchPage(pageUrl);
        const rows = pageData.prices.map((price, index) => ({
          date: moment().format("YYYY-MM-DD HH:mm:ss"),
          image: pageData.images[index + 2],
          lnk1: pageData.lnk1Html[index],
          lnk2: pageData.lnk2Html[index],
          data: pageData.additionalDataHtml[index],
          price: price,
          subway: SUBWAY_ARRAY.some((subwayItem) =>
            pageData.lnk2Html[index]
              .toLowerCase()
              .includes(subwayItem.toLowerCase())
          )
            ? "да"
            : "провери",
        }));
        allData.rows.push(...rows);
        if (currentPage >= parseInt(pageData.numberOfPages)) break;
        currentPage++;
        await delay(1000);
      }
      allData.rows = allData.rows
        .sort((a, b) => a.price - b.price)
        .map((currentRow) => {
          return { ...currentRow, index: counter++ };
        });
      allData.numberOfPages = currentPage.toString();
      allData.resultTypes = Array.from(resultsTypes);
    };

    await fetchData();
    console.log(allData.rows);

    if (allData.resultTypes[0].includes("2-СТАЕН")) {
      await writeInDB(allData.rows, "three_room_data");
    } else {
      await writeInDB(allData.rows, "three_room_data");
    }

    const getRecordsForToday = async () => {
      const todayDate = moment().format("YYYY-MM-DD");
      const records = await db
        .selectFrom("three_room_data")
        .selectAll()
        // @ts-expect-error its ok
        .where(sql`DATE("date") = ${todayDate}`)
        .execute();
      console.log("newRecords", records);
      return records;
    };

    const todayRecords = await getRecordsForToday();

    const generateTableHTML = (todayRecords) => {
      if (todayRecords.length > 0) {
        const tableRows = todayRecords
          .map((item) => {
            return `
          <tr>
            <td>${item.image}</td>
            <td>${item.lnk2}</td>
            <td>${item.price} €</td>
            <td>${item.data}</td>
          </tr>
        `;
          })
          .join("");
        return `
        <table border="1" cellpadding="10" cellspacing="0">
          <thead>
            <tr>
              <th>Снимка</th>
              <th>Локация</th>
              <th>Цена</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
      } else {
        return "<h1>Няма нови обяви</h1>";
      }
    };

    const tableHTML = generateTableHTML(todayRecords);
    const mailOptions = {
      from: '"Imot Scraper" <yoan.emilov@gmail.com>', // Sender address
      to: process.env.receiverAddress, // Receiver address
      subject: "Нови обяви 3-стаен, гр. София", // Subject
      text: "This chron job has completed", // Plain text body
      html: `${tableHTML}`, // HTML body
    };

    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);

      console.log({ message: "Email sent successfully!" });
    } catch (error) {
      console.error("Error sending email:", error);
      console.log({ error: "Failed to send email" });
    }

    return NextResponse.json(allData);
  } catch (error) {
    console.error("Error occurred while scraping:", error);
    return NextResponse.json(
      { error: "Failed to fetch the page." },
      { status: 500 }
    );
  }
}
