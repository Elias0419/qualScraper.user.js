// ==UserScript==
// @name         Mturk Qualification Database and Scraper
// @namespace    https://greasyfork.org/en/users/1004048-elias041
// @version      0.1
// @description  Scrape, display, sort and search your Mturk qualifications
// @author       Elias041
// @license      none
// @match        https://worker.mturk.com/qualifications/assigned
// @match        https://worker.mturk.com/qt
// @require      https://code.jquery.com/jquery-3.6.3.js
// @require      https://unpkg.com/dexie/dist/dexie.js
// @require      https://unpkg.com/ag-grid-community@29.0.0/dist/ag-grid-community.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-apline.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mturk.com
// @grant        none
// ==/UserScript==
 
/*variables*/
let timeout = 1850;
let counter = " ";
let retry_count = 0;
let page = "https://worker.mturk.com/qualifications/assigned.json?page_size=100";
let timeoutId = undefined;
let scraping = false
window.onload = function() { //wait for page to load
 
	/*buttons*/
	let t = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
		e = t.parentNode,
		o = document.createElement("button");
	(o.style.background = "#343aeb"),
	(o.style.color = "#fff"),
	(o.id = "button"),
	(o.innerHTML = "Scrape&nbspQuals"),
	e.insertBefore(o, t);
	document.getElementById("button").addEventListener("click", function e() {
			scraping = true;
			//$("#cancelButton").dialog({})
			$("#button").remove();
			let t = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
				e = t.parentNode,
				c = document.createElement("button");
			(c.style.color = "#fff"),
			(c.style.background = "#fc0f03"),
			(c.innerHTML = "Cancel"),
			(c.id = "cancelButton"),
			e.insertBefore(c, t);
			let b = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
				bParent = b.parentNode,
				bar = document.createElement("div");
			(bar.id = "progressBar"),
			(bar.innerHTML = "&nbsp&nbsp&nbsp" + counter + "&nbsp&nbsp&nbsp")
			bParent.insertBefore(bar, b);;
			document.getElementById("cancelButton").addEventListener("click", function e() {
				$("#cancelButton").remove();
				$("#progressBar").html("&nbsp&nbsp&nbsp&nbspCanceled&nbsp&nbsp<br>" + counter + "&nbsppages&nbspscraped");
				scraping = false
			})
 
			/*init db*/
			var db = new Dexie("qualifications");
			db.version(1).stores({
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
 
			/*main loop*/
			function getAssignedQualifications(nextPageToken = "") {
				if (!scraping) {
					return;
				} //cancel trap
				counter++
				$("#progressBar").html("&nbsp&nbsp&nbspProcessing&nbsppage&nbsp" + counter + "&nbsp&nbsp&nbsp");
 
				$.getJSON(page)
 
					.then(function(data) {
						data.assigned_qualifications.forEach(function(t) {
							db.quals.bulkAdd([{
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
 
						if (data.next_page_token !== null) {
							timeoutId = setTimeout(() => {
								page = `https://worker.mturk.com/qualifications/assigned.json?page_size=100&next_token=${encodeURIComponent(data.next_page_token)}`
								getAssignedQualifications(data.next_page_token);
							}, timeout);
 
 
						} else {
							console.log("Scraping completed");
							console.log(counter + "pages");
							console.log("Timeout" + timeout);
							console.log(retry_count + "timeouts");
							$("#progressBar").html("&nbsp&nbsp&nbspScrape&nbspComplete<br>&nbsp&nbsp&nbsp" + counter + "&nbspPages<br>&nbsp&nbsp&nbsp<a href='https://worker.mturk.com/qt' target='_blank'>Click&nbspHere</a>");
						}
					})
 
					.catch(function(error) { //handle timeouts
							if (error.status === 429 && retry_count < 5) {
								retry_count++;
								timeout += 500;
								console.log("timed out, incrementing clock to " + timeout + " milliseconds")
								setTimeout(() => {
									getAssignedQualifications(nextPageToken);
								}, 10000);
							} else {
								$("#progressBar").html("Timed&nbspout&nbsp5&nbsptimes,&nbspaborting.&nbsp" + timeout + "&nbspmilliseconds.");
								console.log("Timed out 5 times, aborting. " + timeout + " milliseconds.");
 
							}
							/* $("#button").html("Retry?");
							 $("#button").css("background-color", "#e80c0f");
							 document.getElementById("button").addEventListener("click", function e() {
							     location.reload()
 
 
 
							 }*/
 
						}
 
					)
 
			}
 
			getAssignedQualifications();
 
		}
 
 
	)
 
};
 
/*ag-grid*/
if (location.href === "https://worker.mturk.com/qt") {
	document.body.innerHTML = "";
	let gridDiv = document.createElement("div");
	gridDiv.setAttribute("id", "gridDiv");
	document.body.appendChild(gridDiv);
	document.title = "Qualifications";
 
 
	/*init db*/
	var db = new Dexie("qualifications");
	db.version(1).stores({
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
}
</style>
     </div>`
 
/*cellRenderer: 'btnCellRenderer',
      cellRendererParams: {
        clicked: function(field) {
          alert(`${field} was clicked`);
        }
      },*/
 
	const gridOptions = {
		columnDefs: [{
            headerName: 'Mturk Qualification Database and Scraper',
				children: [{
				field: "qualName"
			},
			{
				field: "requester"
            }]},
 
 
                     {
                         headerName: ' ',
				children: [{
 
 
				field: "description",
                width: 350
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
        valueGetter: function(params) {
            var date = new Date(params.data.date);
          return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
        },
        comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
        var dateA = new Date(valueA);
            var dateB = new Date(valueB);
         return dateA - dateB;
        },
		//valueFormatter: function(params) {
			//	return new Date(params.value).toString().substring(4, 15);
		//}
      },
	  {
 
				headerName: "Requester ID",
                width: 150,
				field: "reqURL",
				valueFormatter: function(params) {
					var parts = params.value.split("/");
					return parts[2];
 
				},
 
			},
			{
				headerName: "Qual ID",
				field: "id",
 
				valueFormatter: function(params) {
					if (!params.value || params.value === '') return '';
					var parts = params.value.split("/");
					return parts[2];
 
				}}]
			},
			{
				headerName: 'More',
				children: [{
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
					},
					/*{
						headerName: "id",
						field: "id",
                        hidden: "true",
                        width: 0,
                      columnGroupShow: 'open',
						suppressMenu: true
 
					}*/
				]
			}
		],
		defaultColDef: {
			sortable: true,
			filter: true,
			editable: true,
			resizable: true,
		},
		rowSelection: 'multiple',
		animateRows: true,
		rowData: []
	};
 
	window.addEventListener('load', function() {
		const gridDiv = document.querySelector('#myGrid');
		db.quals.toArray().then(data => {
			gridOptions.rowData = data;
			new agGrid.Grid(gridDiv, gridOptions);
 
		})
	})
}
