// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
  yotobe.searchTemplate = $.templates("#searchResultItem");
  yotobe.playlistTemplate = $.templates("#playlistItem");

  yotobe.player = new YT.Player('screen', {
    height: '190',
    width: '400',
    autoPlay: 0,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  $('#loadingOverlay').hide();
  $('#query').focus();
}

var yotobe = {};
yotobe.lastSearchResults = null;
yotobe.playlist = [];
yotobe.currentlyPlaying = null;

yotobe.searchTemplate = null;
yotobe.playlistTemplate = null;

yotobe.player = null;

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
    yotobe.lastSearchResults = response.result;
    yotobe.searchTemplate.link("#search-container", response.result);
    $('#loadingOverlay').hide();
  });
  return false;
}

function indexInPlaylist(videoId) {
  var videoIndex = 0;
  for (var i in yotobe.playlist) {
    if (yotobe.playlist[i].id.videoId == videoId) {
      videoIndex = i;
      break;
    }
  }
  return videoIndex;
}

function addToPlaylist(e) {
  var videoId = e.getAttribute('data-id');

  var selectedItem = yotobe.lastSearchResults.items.filter(function(element){
    return element.id.videoId == videoId;
  });

  if (selectedItem.length == 1) {
    yotobe.playlist.push(selectedItem[0]);
    yotobe.playlistTemplate.link("#playlist-container", { items: yotobe.playlist });
    updatePlaylist();
  }
}

function clearPlaylist() {
  yotobe.playlist = [];
  $('#playlist-container').html('<li><a class="empty-playlist-label">No videos in your playlist yet</a></li>');
  yotobe.player.loadPlaylist([]);
  yotobe.currentlyPlaying = null;
}

function playItemFromPlaylist(e) {
  $('#screen iframe:first-child').remove();

  var videoId = e.getAttribute('data-id');

  yotobe.currentlyPlaying = indexInPlaylist(videoId);
  yotobe.player.loadVideoById(videoId);
}

function removeItemFromPlaylist(e) {
  var videoId = e.getAttribute('data-id');
  if (yotobe.currentlyPlaying == indexInPlaylist(videoId)) {
    return;
  }
  var videoIndex = indexInPlaylist(videoId);

  if (videoIndex < yotobe.currentlyPlaying) {
    yotobe.currentlyPlaying--;
  }

  yotobe.playlist.splice(videoIndex, 1);
  yotobe.playlistTemplate.link("#playlist-container", { items: yotobe.playlist });
  updatePlaylist();
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.ENDED) {
    if (yotobe.playlist.length > 0) {
      var nextIndex = parseInt(yotobe.currentlyPlaying) + 1;
      yotobe.player.loadVideoById(yotobe.playlist[nextIndex % yotobe.playlist.length].id.videoId);
      yotobe.currentlyPlaying = nextIndex;
      updatePlaylist();
    }
  }

  if (event.data == YT.PlayerState.PLAYING) {
    yotobe.currentlyPlaying = indexInPlaylist(event.target.getVideoData().video_id);
    updatePlaylist();
  }
}

function updatePlaylist() {
  $('.playlist-item.active').removeClass('active');
  if (yotobe.currentlyPlaying != null) {
    $(".playlist-item[data\-id='"+yotobe.playlist[parseInt(yotobe.currentlyPlaying)].id.videoId+"']").addClass('active');
  }
}
