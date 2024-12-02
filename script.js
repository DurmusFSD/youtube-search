let apiKey = "AIzaSyBBauFmL7AlnD-tJVoRirbPPmc7ChY97ZA";
let nextPageToken = "";
let prevPageToken = "";
let totalResults = 0;
let maxResults = 10;
let currentPage = 1;

let searchTermInput = document.getElementById("search");
let fromDateInput = document.getElementById("fromDateInput");
let toDateInput = document.getElementById("toDateInput");

document.getElementById("searchBtn").addEventListener("click", handleSearch);

function handleSearch() {
  currentPage = 1;
  const searchTerm = searchTermInput.value;
  const fromDate = fromDateInput.value;
  const toDate = toDateInput.value;

  const formattedFromDate = new Date(fromDate).toISOString();
  const formattedToDate = new Date(toDate).toISOString();

  fetchData(searchTerm, formattedFromDate, formattedToDate);
}

async function fetchData(
  searchTerm,
  formattedFromDate,
  formattedToDate,
  pageToken = ""
) {
  try {
    let response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?q=${searchTerm}&key=${apiKey}&part=snippet&type=video&publishedAfter=${formattedFromDate}&publishedBefore=${formattedToDate}&maxResults=${maxResults}&pageToken=${pageToken}`
    );

    let data = await response.json();
    if (!response.ok || !data.items) {
      throw new Error("Failed to fetch data from API");
    }

    nextPageToken = data.nextPageToken || "";
    prevPageToken = data.prevPageToken || "";
    totalResults = data.pageInfo?.totalResults || 0;
    await displayResults(data.items);
  } catch (error) {
    console.error("Error fetching data", error);
  }
}

async function displayResults(videos) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  if (videos.length === 0) {
    resultsContainer.innerHTML = `<p class="text-red-500">No videos found for the search term</p>`;
    return;
  }

  let table = document.createElement("table");
  table.classList.add("table", "w-full", "border");

  let tableHead = document.createElement("thead");
  tableHead.innerHTML = `
    <tr>
      <th>Title</th>
      <th>Thumbnail</th>
      <th>Channel</th>
      <th>Views</th>
      <th>Likes</th>
      <th>Comments</th>
    </tr>`;
  table.appendChild(tableHead);

  let tableBody = document.createElement("tbody");

  for (let video of videos) {
    let row = document.createElement("tr");
    let videoId = video.id.videoId;
    let videoStatistics = await fetchVideoStatistics(videoId);

    if (videoStatistics.items.length === 0) continue;

    let statistics = videoStatistics.items[0].statistics || {};
    row.innerHTML = `
      <td class="px-4 py-2">${video.snippet.title}</td>
      <td class="px-4 py-2">
        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
          <img style="width:150px;height:150px;" src="${
            video.snippet.thumbnails.high.url
          }" class="h-16">
        </a>
      </td>
      <td class="px-4 py-2">${video.snippet.channelTitle}</td>
      <td class="px-4 py-2">${statistics.viewCount || "N/A"}</td>
      <td class="px-4 py-2">${statistics.likeCount || "N/A"}</td>
      <td class="px-4 py-2">${statistics.commentCount || "N/A"}</td>`;
    tableBody.appendChild(row);
  }

  table.appendChild(tableBody);
  resultsContainer.appendChild(table);

  renderPagination();
}

async function fetchVideoStatistics(videoId) {
  try {
    let response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${apiKey}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching video statistics", error);
    return { items: [] };
  }
}

function renderPagination() {
  let paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = ``;

  let totalPages = Math.ceil(totalResults / maxResults);

  if (totalPages <= 1) return;

  let prevButton = createPaginationButton("Previous", fetchPrevPage);
  prevButton.disabled = currentPage === 1;

  let nextButton = createPaginationButton("Next", fetchNextPage);
  nextButton.disabled = currentPage === totalPages;

  paginationContainer.appendChild(prevButton);

  let maxPageNumbers = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
  let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

  if (endPage - startPage + 1 < maxPageNumbers) {
    startPage = Math.max(1, endPage - maxPageNumbers + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    let pageButton = createPaginationButton(i.toString(), () => goToPage(i));
    if (i === currentPage) {
      pageButton.disabled = true;
      pageButton.classList.remove("hover:bg-blue-600");
      pageButton.classList.add("bg-blue-600", "cursor-default");
    }
    paginationContainer.appendChild(pageButton);
  }

  paginationContainer.appendChild(nextButton);
}

function createPaginationButton(text, clickHandler) {
  let button = document.createElement("button");
  button.textContent = text;
  button.classList.add(
    "bg-blue-500",
    "text-white",
    "px-4",
    "py-2",
    "rounded",
    "hover:bg-blue-600",
    "mr-2"
  );
  button.addEventListener("click", clickHandler);
  return button;
}

async function fetchNextPage() {
  currentPage++;
  const formattedFromDate = new Date(fromDateInput.value).toISOString();
  const formattedToDate = new Date(toDateInput.value).toISOString();
  await fetchData(
    searchTermInput.value,
    formattedFromDate,
    formattedToDate,
    nextPageToken
  );
}

async function fetchPrevPage() {
  currentPage--;
  const formattedFromDate = new Date(fromDateInput.value).toISOString();
  const formattedToDate = new Date(toDateInput.value).toISOString();
  await fetchData(
    searchTermInput.value,
    formattedFromDate,
    formattedToDate,
    prevPageToken
  );
}

function goToPage(page) {
  currentPage = page;
  const formattedFromDate = new Date(fromDateInput.value).toISOString();
  const formattedToDate = new Date(toDateInput.value).toISOString();
  fetchData(searchTermInput.value, formattedFromDate, formattedToDate);
}
