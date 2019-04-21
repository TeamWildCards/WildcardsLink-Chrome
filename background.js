chrome.app.runtime.onLaunched.addListener(function() {
  console.log("backgroud")
  chrome.app.window.create('index.html', {
	id: "wildcardslink-chrome-main",
    innerBounds: {
      width: 400,
      height: 500,
      minWidth: 400,
      minHeight: 500,
      maxWidth: 400,
      maxHeight: 500
    }
  });
});
