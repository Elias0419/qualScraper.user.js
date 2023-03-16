// ==UserScript==
// @name         Mturk Qualification Database and Scraper
// @namespace    https://greasyfork.org/en/users/1004048-elias041
// @version      0.8
// @description  Scrape, display, sort and search your Mturk qualifications
// @author       Elias041
// @match        https://worker.mturk.com/qualifications/assigned
// @match        https://worker.mturk.com/qt
// @require      https://code.jquery.com/jquery-3.6.3.js
// @require      https://code.jquery.com/ui/1.13.1/jquery-ui.min.js
// @require      https://unpkg.com/dexie/dist/dexie.js
// @require      https://unpkg.com/ag-grid-community@29.0.0/dist/ag-grid-community.min.js
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-apline.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mturk.com
// @license      none
// @grant        none
// ==/UserScript==

let scraping = false;
window.onload = function ()
{
	let t = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
	e = t.parentNode,
	o = document.createElement("div");
	o.style.color = "#fff";
	o.style.padding = "10px";
	o.style.boxShadow = "2px 2px 4px #888888";
	o.style.background = "#33773A";
	o.style.opacity = "0.5";
	o.style.cursor = "pointer";
	o.id = "button";
	o.innerHTML = "Scrape&nbspQuals";
	e.insertBefore(o, t);

	let c = document.createElement("div");
	c.style.color = "#fff";
	c.style.background = "#C78D99";
	c.style.padding = "10px";
	c.style.boxShadow = "2px 2px 4px #888888";
	c.style.background = "#383c44";
	c.style.opacity = "0.5";
	c.style.cursor = "pointer";
	c.innerHTML = "Cancel";
	c.id = "cancelButton";
	e.insertBefore(c, t);


	let d = document.createElement("div");
	d.style.color = "#fff";
	d.style.background = "#fc0f03";
	d.style.padding = "10px";
	d.style.boxShadow = "2px 2px 4px #888888";
	d.style.background = "#323552";
	d.style.opacity = "0.5";
	d.style.cursor = "pointer";
	d.innerHTML = "Database";
	d.id = "dbButton";
	e.insertBefore(d, t);

	let f = document.createElement("div");
	f.style.color = "#fff";
	f.style.padding = "10px";
	f.style.boxShadow = "2px 2px 4px #888888";
	f.style.background = "#33773A";
	f.style.opacity = "0.5";
	f.id = "progress";
	f.innerHTML = "-";
	e.insertBefore(f, t);

	document.getElementById("dbButton").addEventListener("click", function e()
	{
		window.open("https://worker.mturk.com/qt", "_blank");
	});

	let timeout = 1850;
	let counter = " ";
	let retry_count = 0;
	let error_count = 0;
	let page = "https://worker.mturk.com/qualifications/assigned.json?page_size=100";

	document.getElementById("cancelButton").addEventListener("click", function e()
	{
		retry_count = 0;
		scraping = false;
		$("#cancelButton").css('background', '#383c44')
		$("#button").css('background', '#33773A')
		$("#progress").html("-")
	})
	document.getElementById("button").addEventListener("click", function e()
	{
		localStorage.setItem('incompleteScrape', true);
		scraping = true;
		$("#button").css('background', '#383c44')
		$("#cancelButton").css('background', '#CE3132')



		/*init db*/
		var db = new Dexie("qualifications_v2");
		db.version(2).stores(
		{
			quals: `
    id,
    requester,
    description,
    score,
    date,
    qualName,
    reqURL,
    reqQURL,
    retURL,
    canRetake,
    hasTest,
    canRequest,
    isSystem`
		});

		function readDatabase()
		{
			return db.quals.toArray();
		}

		async function compareDatabases(oldDBPromise)
		{

			const newDB = await readDatabase()
			return oldDBPromise.then(oldDB =>
			{
				let changes = [];

				for (let i = 0; i < newDB.length; i++)
				{
					let newRecord = newDB[i];
					let oldRecord = oldDB.find(r => r.id === newRecord.id);


					if (oldRecord && oldRecord.score !== newRecord.score)
					{
						changes.push(
						{
							id: newRecord.id,
							field: "score",
							requester: newRecord.requester,
							qualName: newRecord.qualName,
							oldValue: oldRecord.score,
							newValue: newRecord.score
						});
					}
				}

				if (changes.length > 0)
				{
					localStorage.setItem("changes", JSON.stringify(changes));
					localStorage.setItem("hasChanges", true);
					return changes;
				}
			})
		}


		function checkFirstRun()
		{
			db.quals.count().then(count =>
			{
				if (count === 0)
				{

					localStorage.setItem("firstRun", true);
				}
				else
				{
					localStorage.setItem("firstRun", false);
				}
			});
		}

		checkFirstRun();
		let timeoutId;
		let oldDBPromise;
		let totalRetries = 0;

		function getAssignedQualifications(nextPageToken = "")
		{
			if (oldDBPromise === undefined)
			{
				oldDBPromise = readDatabase();

			}
			if (!scraping)
			{
				return;
			}
			$("#progress").html(counter);
			$.getJSON(page)

				.then(function (data)
				{
					counter++
					retry_count = 0
					data.assigned_qualifications.forEach(function (t)
					{

						db.quals.bulkPut([
						{
							id: t.request_qualification_url,
							requester: t.creator_name,
							description: t.description,
							canRetake: t.can_retake_test_or_rerequest,
							retry: t.earliest_retriable_time,
							score: t.value,
							date: t.grant_time,
							qualName: t.name,
							reqURL: t.creator_url,
							retURL: t.retake_test_url,
							isSystem: t.is_system_qualification,
							canRequest: t.is_requestable,
							hasTest: t.has_test
						}])
					})

					if (data.next_page_token !== null)
					{
						timeoutId = setTimeout(() =>
						{
							page = `https://worker.mturk.com/qualifications/assigned.json?page_size=100&next_token=${encodeURIComponent(data.next_page_token)}`
							getAssignedQualifications(data.next_page_token);
						}, timeout);

					}
					else if (data.next_page_token === null)
					{
						console.log("Scraping completed");
						console.log(counter + " pages");
						console.log(totalRetries + " timeouts");
						console.log("Clock was " + timeout);
						if (localStorage.getItem("firstRun") === "false")
						{

							compareDatabases(oldDBPromise)
						}
						localStorage.setItem('incompleteScrape', false);
						$("#cancelButton").css('background', '#383c44');
						$("#progress").css('background', '#25dc12');
						$("#progress").html('&#10003;');
						$("#dbButton").css('background', '#57ab4f');

					}
					else
					{
						console.log("Timeout or abort. Clock was " + timeout);
						$("#progress").css('background', '#FF0000');
						$("#progress").html('&#88;');
						return;
					}
				})

				.catch(function (error)
				{
					if (error.status === 429 && retry_count < 20)
					{

						retry_count++
						totalRetries++
						setTimeout(() =>
						{
							getAssignedQualifications(nextPageToken);
						}, 3000);
					}
					else if (error.status === 429 && retry_count > 20)
					{
						console.log("error " + error_count)
						error_count++;
						timeout += 1000
						setTimeout(() =>
						{
							getAssignedQualifications(nextPageToken);
						}, 10000);

					}
					else if (error.status === 429 && retry_count > 20 && error_count > 3)
					{
						alert("There was a problem accessing the Mturk website. Scraping halted.")
						scraping = false
						return;

					}
					else if (error.status === 503)
					{
						$("#progress").css('background', '#FFFF00');
						$("#progress").html('&#33;');
						if (confirm("Mturk responded with 503: Service Unavailable. Retry?"))
						{
							$("#progress").css('background', '#33773A');
							setTimeout(() =>
							{
								getAssignedQualifications(nextPageToken);
							}, 10000);
						}
						else
						{
							$("#progress").css('background', '#FF0000');
							$("#progress").html('&#88;');
							console.log("User declined retry.");
							return;
						}
					}
				})
		}

		getAssignedQualifications();

	})
};


if (location.href === "https://worker.mturk.com/qt")
{
	document.body.innerHTML = "";
	let gridDiv = document.createElement("div");
	gridDiv.setAttribute("id", "gridDiv");
	document.body.appendChild(gridDiv);
	document.title = "Qualifications";
	window.closeModal = function ()
	{
		document.getElementById("changesModal").style.display = "none";
		localStorage.setItem("hasChanges", false);

	}
	window.closeIModal = function ()
	{
		document.getElementById("incompleteModal").style.display = "none";
	}
	var db = new Dexie("qualifications_v2");
	db.version(2).stores(
	{
		quals: `
        id,
        requester,
        description,
        score,
        date,
        qualName,
        reqURL,
        reqQURL,
        retURL,
        canRetake,
        hasTest,
        canRequest,
        isSystem`
	});

	function displayChangeDetails()
	{
		if (localStorage.getItem("firstRun") === "true")
		{
			document.getElementById("changesModal").style.display = "none";
			localStorage.setItem("hasChanges", false);
			return;
		}
		if (localStorage.getItem("hasChanges") === "true")
		{
			let storedData = localStorage.getItem("changes");
			if (storedData)
			{
				let changeDetails = JSON.parse(storedData);
				let changesList = document.getElementById("changesList");
				changeDetails.forEach(function (detail)
				{
					let changeText = detail.requester + " - " + detail.qualName + " - " + detail.field + ": " + detail.oldValue + " -> " + detail.newValue;
					let changeItem = document.createElement("div");
					changeItem.textContent = changeText;
					changesList.appendChild(changeItem);
				});
				document.getElementById("changesModal").style.display = "block";
			}
		}
	}

	function incompleteScrapeNotification()
	{
		if (localStorage.getItem("incompleteScrape") === "true")
		{
			document.getElementById("incompleteModal").style.display = "block";
		}
	}

	gridDiv.innerHTML = `
<div id="myGrid"  class="ag-theme-alpine">
<style>
.ag-theme-alpine {
    --ag-grid-size: 3px;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

  .modal {
    display: none;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
    background-color: #fefefe;
    margin: auto;
    margin-top: 10%;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
}

.modal-footer {
    padding: 10px;
    text-align: right;
}

.modal-close {
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 8px 16px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
}

/* Center the modal content vertically */
@media screen and (min-height: 600px) {
    .modal-content {
        margin-top: 15%;
    }}}
</style>
<div id="changesModal" class="modal">
    <div class="modal-content">
        <h4>Changes Detected</h4>
        <p id="changesList"></p>
    </div>
    <div class="modal-footer">
        <button class="modal-close" onclick="closeModal()">Close</button>
    </div>
</div>
     </div>


<div id="incompleteModal" class="modal">
    <div class="modal-content">
        <h4>Incomplete Scrape Detected</h4>
        <p>A scrape is in progress or the last scrape was incomplete.</p>
    </div>
    <div class="modal-footer">
        <button class="modal-close" onclick="closeIModal()">Close</button>
    </div>
</div>
     </div>
     `


	const gridOptions = {
		columnDefs: [
			{
				headerName: 'Mturk Qualification Database and Scraper',
				children: [
				{
					field: "qualName",
					comparator: function (valueA, valueB, nodeA, nodeB, isInverted)
					{
						return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
					}
				},
				{
					headerName: "Requester",
					field: "requester",
					comparator: function (valueA, valueB, nodeA, nodeB, isInverted)
					{
						return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
					}
				}]
			},


			{
				headerName: ' ',
				children: [
				{
					field: "description",
					width: 350,
					cellRenderer: function (params)
					{
						return '<span title="' + params.value + '">' + params.value + '</span>';
					},
					comparator: function (valueA, valueB, nodeA, nodeB, isInverted)
					{
						return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
					}
				},
				{
					headerName: "Value",
					field: "score",
					width: 100
				},
				{
					headerName: "Date",
					field: "date",
					width: 100,
					valueGetter: function (params)
					{
						var date = new Date(params.data.date);
						return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
					},
					comparator: function (valueA, valueB, nodeA, nodeB, isInverted)
					{
						var dateA = new Date(valueA);
						var dateB = new Date(valueB);
						return dateA - dateB;
					},
				},
				{

					headerName: "Requester ID",
					width: 150,
					field: "reqURL",
					valueFormatter: function (params)
					{
						var parts = params.value.split("/");
						return parts[2];

					},

				},
				{
					headerName: "Qual ID",
					field: "id",

					valueFormatter: function (params)
					{
						if (!params.value || params.value === '') return '';
						var parts = params.value.split("/");
						return parts[2];
					}
				}]
			},
			{
				headerName: 'More',
				children: [
				{
					headerName: " ",
					field: " ",
					width: 100,
					columnGroupShow: 'closed'
				},
				{
					headerName: "Retake",
					field: "canRetake",
					width: 100,
					columnGroupShow: 'open',
					suppressMenu: true
				},
				{
					headerName: "hasTest",
					field: "hasTest",
					width: 100,
					columnGroupShow: 'open',
					suppressMenu: true
				},
				{
					headerName: "canReq",
					field: "canRequest",
					width: 100,
					columnGroupShow: 'open',
					suppressMenu: true
				},
				{
					headerName: "System",
					field: "isSystem",
					width: 100,
					columnGroupShow: 'open',
					suppressMenu: true
				}, ]
			}
		],
		defaultColDef:
		{
			sortable: true,
			filter: true,
			editable: true,
			resizable: true,
		},
		rowSelection: 'multiple',
		animateRows: true,
		rowData: []
	};


	window.addEventListener('load', function ()
	{
		displayChangeDetails();
		incompleteScrapeNotification()
		const gridDiv = document.querySelector('#myGrid');
		db.quals.toArray().then(data =>
		{

			var filteredData = data.filter(function (row)
			{
				return !row.qualName.includes("Exc: [");
			});
			gridOptions.rowData = filteredData;
			new agGrid.Grid(gridDiv, gridOptions);


		})
	})
};
