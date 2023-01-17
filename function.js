if (data.next_page_token !== null) {
            setTimeout(() => {
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
                    $("#progressBar").html("Timed&nbspout&nbsp5&nbsptimes,&nbspaborting.&nbsp" +timeout+"&nbspmilliseconds.");
              console.log("Timed out 5 times, aborting. " +timeout+" milliseconds.");
            }
                $("#button").html("Retry?");
                $("#button").css("background-color", "#e80c0f");
                document.getElementById("button").addEventListener("click", function e() {
                location.reload()
