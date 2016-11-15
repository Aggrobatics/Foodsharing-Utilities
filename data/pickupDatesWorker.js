console.log("pickupWorker is updating");

self.port.emit("pickupDates", document.querySelector("#right > div:nth-child(1)"));