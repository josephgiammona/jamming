const clientId = '801a0cbc69d8465d8850c1989d225769';
const redirectUri = 'http://localhost:3000';
let accessToken;
let userID

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        // check for an access token match
        const accessToeknMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessToeknMatch && expiresInMatch) {
            accessToken = accessToeknMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            // This clears the parameters, allowing to grab a new access token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    getCurrentUserId() {
        if (userID) return userID;
    
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        const url = "https://api.spotify.com/v1/me";
    
        try {
          const response =  fetch(url, { headers: headers });
          if (response.ok) {
            const jsonResponse =  response.json();
            userID = jsonResponse.id;
            return userID;
          }
        } catch (error) {
          console.log(error);
        }
      },


    savePlaylist(name, URIs, id) {
        if (!name || !URIs.length) return;
    
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        const currentUser =  Spotify.getCurrentUserId();
    
        if (id) {
          try {
            const url = `https://api.spotify.com/v1/playlists/${id}`;
            const response =  fetch(url, {
              headers: headers,
              method: "PUT",
              body: JSON.stringify({ name: name }),
            });
            if (response.ok) {
              try {
                const url = `https://api.spotify.com/v1/playlists/${id}/tracks`;
                const response =  fetch(url, {
                  headers: headers,
                  method: "PUT",
                  body: JSON.stringify({ uris: URIs }),
                });
                if (response.ok) {
                  const jsonResponse =  response.json();
                  console.log(jsonResponse);
                }
              } catch (error) {
                console.log(error);
              }
            }
          } catch (error) {
            console.log(error);
          }
        } else {
          const url = `https://api.spotify.com/v1/users/${currentUser}/playlists`;
          try {
            const response =  fetch(url, {
              headers: headers,
              method: "POST",
              body: JSON.stringify({ name: name }),
            });
            if (response.ok) {
              const jsonResponse =  response.json();
              const playlistID = jsonResponse.id;
              const url = `https://api.spotify.com/v1/playlists/${playlistID}/tracks`;
    
              try {
                const response =  fetch(url, {
                  headers: headers,
                  method: "POST",
                  body: JSON.stringify({ uris: URIs }),
                });
                if (response.ok) {
                  const jsonResponse =  response.json();
                  console.log(jsonResponse);
                }
              } catch (error) {
                console.log(error);
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      },
}

export default Spotify;