// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
  $('#loadingOverlay').hide();
  $('#query').focus();
  window.yotobe.searchTemplate = $.templates("#searchResultItem");
  window.yotobe.playlistTemplate = $.templates("#playlistItem");
}

window.yotobe = {};
window.yotobe.lastSearchResults = null;
window.yotobe.playlist = [];

window.yotobe.searchTemplate = null;
window.yotobe.playlistTemplate = null;

// Search for a specified string.
function search() {
  $('#loadingOverlay').show();
  var q = $('#query').val();
  var request = gapi.client.youtube.search.list({
    q: q,
    part: 'snippet',
    type: 'video',
    maxResults: 10
  });

  request.execute(function(response) {
    window.yotobe.lastSearchResults = response.result;
    window.yotobe.searchTemplate.link("#search-container", response.result);
    $('#loadingOverlay').hide();
  });
  return false;
}

function clearSearchResults() {
  window.yotobe.lastSearchResults = [];
  window.yotobe.searchTemplate.link("#search-container", window.yotobe.lastSearchResults);
}

function indexInPlaylist(videoId) {
  var videoIndex = 0;
  for (var i in window.yotobe.playlist) {
    if (window.yotobe.playlist[i].id.videoId == videoId) {
      videoIndex = i;
      break;
    }
  }
  return videoIndex;
}

function addToPlaylist(e) {
  var videoId = e.getAttribute('data-id');

  var selectedItem = window.yotobe.lastSearchResults.items.filter(function(element){
    return element.id.videoId == videoId;
  });
  if (selectedItem.length == 1) {
    window.yotobe.playlist.push(selectedItem[0]);

    window.yotobe.playlistTemplate.link("#playlist-container", { items: window.yotobe.playlist });
  }
}

function addAllToPlaylist() {
  window.yotobe.playlist = window.yotobe.playlist.concat(window.yotobe.lastSearchResults.items);
  window.yotobe.playlistTemplate.link("#playlist-container", { items: window.yotobe.playlist });
}

function clearPlaylist() {
  window.yotobe.playlist = [];
  $('#playlist-container').html('<li><a class="empty-playlist-label">No videos in your playlist yet</a></li>');
}

function playItemFromPlaylist(e) {
  var videoId = e.getAttribute('data-id');
  var videoIndex = indexInPlaylist(videoId);
   
  var ids = window.yotobe.playlist
    .map(function(e){ return e.id.videoId});        // map the objects to the videoId's

  ids = ids
    .splice(videoIndex)                             // grab all items from the selected item to the last in the list
    .concat(ids.splice(0, videoIndex))              // grab all item before the selected item
    .splice(1)                                      // skip the first item(since it is already used in videoId)
    ;

  $('#screen iframe:first-child').remove();
  // https://developers.google.com/youtube/player_parameters
  $('#screen').html('<iframe width="400" height="190" src="https://www.youtube.com/embed/'+videoId+'?autoplay=1&loop=1&playlist='+ids.join(",")+'" frameborder="0"></iframe>');
}

function removeItemFromPlaylist(e) {
  var videoId = e.getAttribute('data-id');
  var videoIndex = indexInPlaylist(videoId);
  window.yotobe.playlist.splice(videoIndex, 1);
  window.yotobe.playlistTemplate.link("#playlist-container", { items: window.yotobe.playlist });
}