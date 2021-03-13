"use strict";

$(async function () {
  const $latitude = $("#input-latitude");
  const $longitude = $("#input-longitude");
  const $city = $("#city");
  const $countryflag = $("#input-country-flag");
  const $textarea = $("#textarea-new-post");
  const $latest = $("#latest");

  const makeValid = (element) => {
    element.removeClass("is-invalid").addClass("is-valid");
  };

  const makeInvalid = (element) => {
    element.removeClass("is-valid").addClass("is-invalid");
  };

  const getPosition = (options) => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const hideError = () => {
    $("#error > small").html("");
    $("#error").hide();
  };

  const showError = (err) => {
    $("#error > small").html(err);
    $("#error").show();
  };

  const updatePosition = () => {
    // intermediate values
    $latitude.val("");
    $longitude.val("");
    $city.val("");
    $countryflag.attr("src", "");

    getPosition()
      .then((pos) => {
        hideError();
        const { latitude, longitude } = pos.coords;
        $latitude.val(latitude);
        $longitude.val(longitude);
        makeValid($latitude);
        makeValid($longitude);
        updateCity();
      })
      .catch((err) => {
        console.log(err);
        showError(`ERROR: "${err.message}"`);
        makeInvalid($latitude);
        makeInvalid($longitude);
        makeInvalid($city);
      });
  };

  const getCity = async (long, lat) => {
    try {
      const response = await fetch(`/api/cities/?long=${long}&lat=${lat}`);

      if (response.ok) {
        return response.json();
      } else {
        // server error
        throw new Error(response.statusText);
      }
    } catch (err) {
      // catch either fetch errors or server errors
      console.log(err);
    }
  };

  const updateCity = () => {
    const latitude = $latitude.val();
    const longitude = $longitude.val();

    if (!latitude || latitude < -90 || latitude > 90) {
      makeInvalid($latitude);
      showError("Invalid latitude");
    } else {
      makeValid($latitude);
    }

    if (!longitude || longitude < -180 || longitude > 180) {
      makeInvalid($longitude);
      showError("Invalid longitude");
    } else {
      makeValid($longitude);
    }

    if ($latitude.hasClass("is-invalid") || $longitude.hasClass("is-invalid")) {
      return;
    }

    hideError();

    // intermediate values
    $city.val("Updating city...");
    $countryflag.attr("src", "");

    getCity(longitude, latitude)
      .then((city) => {
        $city.val(city.name);
        $city.data("country", city.country);
        $countryflag.attr(
          "src",
          `https://www.countryflags.io/${city.country}/flat/64.png`
        );

        makeValid($city);
      })
      .catch((err) => {
        console.log(err);
        $city.val("ERROR: something went wrong");
        makeInvalid($city);
      });
  };

  const getData = async (before = Date.now(), limit = 5) => {
    try {
      const response = await fetch(
        `/api/posts/?before=${before}&limit=${limit}`
      );

      if (response.ok) {
        return response.json();
      } else {
        // server error
        throw new Error(response.statusText);
      }
    } catch (err) {
      // catch either fetch errors or server errors
      console.log(err);
    }
  };

  const postData = async (data) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return response.json();
      } else {
        // server error
        throw new Error(response.statusText);
      }
    } catch (err) {
      // catch either fetch errors or server errors
      console.log(err);
    }
  };

  const addRow = (data, order) => {
    const { _id, city, country, date, text } = data;

    // escape HTML characters
    const escapedText = text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/\'/g, "&apos;");

    const dayjsDate = dayjs(date);
    const flagHTML = `<img class="countryFlag" src="https://www.countryflags.io/${country}/flat/64.png" alt="${country}" data-bs-toggle="tooltip" data-bs-placement="top" title="${country.toUpperCase()}"></img>`;
    const listHTML = `<li class="list-group-item" data-id="${_id}">
    <div class="d-flex w-100 justify-content-between text-muted">
        <small class="mb-1">${city} ${flagHTML}</small>
        <small class="timeago" data-timestamp="${dayjsDate.valueOf()}">${dayjsDate.fromNow()}</small>
    </div>
    <p class="mb-1 post-text">${escapedText}</p>
  </li>`;

    if (order === "prepend") {
      $latest.prepend(listHTML);
    } else if (order === "append") {
      $latest.append(listHTML);
    }
  };

  // --------------------------  EVENT HANDLERS  --------------------------

  $(document).on("show.bs.collapse", "#collapse-new-post", (e) => {
    $("#btn-new-post").hide();
  });

  $(document).on("hide.bs.collapse", "#collapse-new-post", (e) => {
    $("#btn-new-post").show();
  });

  $(document).on("click", "#btn-get-position", (e) => {
    e.preventDefault();
    updatePosition();
  });

  $(document).on("click", "#btn-update-city", (e) => {
    e.preventDefault();
    updateCity();
  });

  $(document).on("click", "#btn-scroll-top", (e) => {
    e.preventDefault();
    $(window).scrollTop(0);
  });

  $(document).on("click", "#btn-load-more", async (e) => {
    e.preventDefault();

    const before = $(".timeago").last().data("timestamp");
    const data = await getData(before);

    if (data.length) {
      data.forEach((post) => addRow(post, "append"));
    } else {

      // server returned no posts
      $("#btn-load-more").html("No more posts").attr("disabled", true);
    }
  });

  $(document).on("click", "#btn-submit", async (e) => {
    e.preventDefault();
    const text = $textarea.val().trim();
    const city = $city.val();
    const country = $city.data("country");

    if (!text) {
      makeInvalid($textarea);
      showError("Write something");
      return;
    } else {
      makeValid($textarea);
    }

    if (!city) {
      makeInvalid($city);
      showError("Need city");
      return;
    }

    // send http request to make new post
    const result = await postData({
      text,
      city,
      country,
      date: new Date(),
    });

    // POST successful
    if (result) {
      hideError();
      socket.emit("new post", result);
      $textarea.val("");
      $textarea.removeClass("is-valid");
      addRow(result, "prepend", true);
    } else {
      showError("ERROR: Please try again");
    }
  });

  // -------------------------------  INIT  -------------------------------
  const data = await getData();

  if (data.length) {
    data.forEach((post) => addRow(post, "append"));
  } else {
    // todo if no data display a message (message must be removed subsequently)
  }

  const socket = io();

  // new post received (from elsewhere)
  socket.on("new post", (data) => {
    addRow(data, "prepend", true);
  });

  // -----------------------------  TOOLTIPS  -----------------------------
  const initializeTooltip = (el) => {
    return new bootstrap.Tooltip(el);
  };

  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );

  var tooltipList = tooltipTriggerList.map(initializeTooltip);

  // ------------------------  REFRESH TIMESTAMPS  ------------------------
  const refreshTimeago = () => {
    $(".timeago").each((i, element) => {
      const $element = $(element);
      $element.html(dayjs($element.data("timestamp")).fromNow());
    });
  };

  // refresh every minute
  setInterval(refreshTimeago, 1000 * 60);
});
