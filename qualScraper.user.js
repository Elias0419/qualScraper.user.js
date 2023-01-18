let timeout = 1850;
let counter = " ";
let retry_count = 0;
let page = "https://worker.mturk.com/qualifications/assigned.json?page_size=100";
let timeoutId = undefined;
window.onload = function() {
  let t = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
    e = t.parentNode,
    o = document.createElement("button");
  (o.style.background = "#343aeb"),
  (o.style.border = "3px"),
  (o.style.padding = "0px 14px"),
  (o.style.fontSize = "15px"),
  (o.style.color = "#fff"),
  (o.id = "button"),
  (o.innerHTML = "Scrape&nbspQuals"),
  e.insertBefore(o, t);
  let b = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
    bParent = b.parentNode,
    bar = document.createElement("div");
  (bar.id = "progressBar"),
  (bar.innerHTML = `&nbsp&nbsp&nbsp` + counter +

    `&nbsp&nbsp&nbsp
    <!-- Progress bar-->
   `
  )
  bParent.insertBefore(bar, b);;

  document.getElementById("button").addEventListener("click", function e() {

      $("#button").remove();
      let t = document.getElementsByClassName("col-xs-5 col-md-3 text-xs-right p-l-0")[0],
        e = t.parentNode,
        c = document.createElement("button");
      (c.style.color = "#fff"),
      (c.style.background = "#fc0f03"),
      (c.innerHTML = "Cancel"),
      (c.id = "cancelButton"),
      e.insertBefore(c, t);

      document.getElementById("cancelButton").addEventListener("click", function e() {
        try {
          console.log("TEST");
          throw new Error("Cancelled");
          return;
        } catch (error) {
          if (error.message === "Cancelled") {
            // Code to handle the "Cancelled" error
            return;
          } else {
            throw error;
          }
        }
      });

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

      function getAssignedQualifications(nextPageToken = "")


      {
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
                //reqQURL: t.request_qualification_url,
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

          .catch(function(error) {
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
              $("#button").html("Retry?");
              $("#button").css("background-color", "#e80c0f");
              document.getElementById("button").addEventListener("click", function e() {
                  location.reload()


                }

              )

            }

          )

      }
      getAssignedQualifications();
      //console.log(timeoutId);
      //if(cancel){
      // return;}

      console.log(setTimeout)
    }

  )

};

//console.log(counter)





if (location.href === "https://worker.mturk.com/qt") {
  document.body.innerHTML = "";
  let gridDiv = document.createElement("div");
  gridDiv.setAttribute("id", "gridDiv");
  document.body.appendChild(gridDiv);
  document.title = "TEST";

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
<div id="myGrid" style=" width: 100%; height: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0;" class="ag-theme-alpine">
<style>
.ag-theme-alpine {
    --ag-grid-size: 3px;
}
    @media only screen {
        html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
            -webkit-overflow-scrolling: touch;
        }
        html {
            position: absolute;
            top: 0;
            left: 0;
            padding: 0;
            overflow: auto;
        }
        body {
            padding: 1rem;
            overflow: auto;
        }
    }
</style>
     </div>`


  const gridOptions = {
    columnDefs: [{
        field: "qualName"
      },
      {
        field: "requester"
      },
      {
        field: "description"
      },
      {
        field: "score",
        width: 100
      },
      {
        field: "date",
        width: 120,
      },
      {
        headerName: 'Other Details',
        children: [{
            field: "canRetake",
            columnGroupShow: 'closed'
          },
          {
            field: "hasTest",
            columnGroupShow: 'open'
          },
          {
            field: "canRequest",
            columnGroupShow: 'open'
          },
          {
            field: "isSystem",
            columnGroupShow: 'open'
          },
          {
            field: "id",
            columnGroupShow: 'open'
          },
          {
            field: "reqURL",
            columnGroupShow: 'open'
          },
          {
            field: "reqQURL",
            columnGroupShow: 'open'
          },
          {
            field: "retURL",
            columnGroupShow: 'open'
          },
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
