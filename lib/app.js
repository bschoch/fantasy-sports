var fs = require('fs')
var q = require('q')
var express = require('express')

var App = {}
function start() {
    App.Away = {}
    App.Home = {}
    App.Players = {}
    App.PlayersPositions = {
        "QB": []
        , "RB": []
        , "WR": []
        , "TE": []
    }
    App.Plays = []
    var promises = []

    App.Contestants = {
        "Bradley": {
            "name": "Bradley"
            , "QB": []
            , "RB": []
            , "WR": []
            , "TE": []
        },
        "Charlie": {
            "name": "Charlie"
            , "QB": []
            , "RB": []
            , "WR": []
            , "TE": []
        },
        "Jackie": {
            "name": "Jackie"
            , "QB": []
            , "RB": []
            , "WR": []
            , "TE": []
        },
        "Will": {
            "name": "Will"
            , "QB": []
            , "RB": []
            , "WR": []
            , "TE": []
        }
    }

    var gamePromise = q.defer()
    promises.push(gamePromise.promise)
    fs.readFile("/Users/Bradley/src/github.com/fantasy-sports/lib/game_list_week_11.csv", 'utf8', function(err, data) {
        if (err) {
            gamePromise.reject(true)
            return
        }
        data = data.split("\n")
        data.forEach(function(game, index) {
            if (game && index !== 0) {
                game = game.split(",")
                if (game.length === 2) {
                    App.Away[game[0]] = game[1]
                    App.Home[game[1]] = game[0]
                }
            }
        })
        gamePromise.resolve(true)
    });

    var playerPromise = q.defer()
    promises.push(playerPromise.promise)
    fs.readFile("/Users/Bradley/src/github.com/fantasy-sports/lib/player_list_week11.csv", 'utf8', function(err, data) {
        if (err) {
           playerPromise.reject(true)
           return
        }
        data = data.split("\n")
        var fieldNames = []
        data.forEach(function(playerCsv, index) {
            if (playerCsv) {
                playerCsv = playerCsv.split(",")
                if (index === 0) {
                    playerCsv.forEach(function(fieldName) {
                        fieldNames.push(fieldName)
                    })
                } else {
                    if (playerCsv.length === fieldNames.length) {
                        var player = {}
                        fieldNames.forEach(function(fieldName, index) {
                            player[fieldName] = playerCsv[index]
                        })
                        App.Players[player.playerid] = player
                        App.PlayersPositions[player.position].push(player)
                    }
                }
            }
        })

        for (var contestant in App.Contestants) {
            var randomIndex
                contestant = App.Contestants[contestant]
                // pick 1 QB
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.QB.length))
                contestant.QB.push(App.PlayersPositions.QB[randomIndex])
                App.PlayersPositions.QB.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.QB.push(contestant.QB[0])

                // pick 1 TE
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.TE.length))
                contestant.TE.push(App.PlayersPositions.TE[randomIndex])
                App.PlayersPositions.TE.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.TE.push(contestant.TE[0])

                // pick 2 RB
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.RB.length))
                contestant.RB.push(App.PlayersPositions.RB[randomIndex])
                App.PlayersPositions.RB.splice(randomIndex, 1)

                randomIndex = Math.floor((Math.random() * App.PlayersPositions.RB.length))
                contestant.RB.push(App.PlayersPositions.RB[randomIndex])
                App.PlayersPositions.RB.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.RB.push(contestant.RB[0])
                App.PlayersPositions.RB.push(contestant.RB[1])

                // pick 2 WR
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.WR.length))
                contestant.WR.push(App.PlayersPositions.WR[randomIndex])
                App.PlayersPositions.WR.splice(randomIndex, 1)

                randomIndex = Math.floor((Math.random() * App.PlayersPositions.WR.length))
                contestant.WR.push(App.PlayersPositions.WR[randomIndex])
                App.PlayersPositions.WR.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.WR.push(contestant.WR[0])
                App.PlayersPositions.WR.push(contestant.WR[1])
            }

        playerPromise.resolve(true)

    })

    var playsPromise = q.defer()
    promises.push(playsPromise.promise)
    fs.readFile("/Users/Bradley/src/github.com/fantasy-sports/lib/week11.csv", 'utf8', function(err, data) {
        if (err) {
            playsPromise.reject(true)
        }
        data = data.split("\n")
        var fieldNames = []
        data.forEach(function(playsCsv, index) {
            if (playsCsv) {
                playsCsv = playsCsv.split(",")
                if (index === 0) {
                    playsCsv.forEach(function(fieldName) {
                        fieldNames.push(fieldName)
                    })
                } else {
                    if (playsCsv.length === fieldNames.length) {
                        var play = {}
                        fieldNames.forEach(function(fieldName, index) {
                            play[fieldName] = playsCsv[index]
                        })
                        App.Plays.push(play)
                    }
                }
            }
        })
        playsPromise.resolve(true)
    });

    return q.all(promises)
}

start().then(function() {
    var server = express()
    server.get('api/teams/:team', function(req, res){
        var team = req.params.team
        team = App.Contestants[team]
        if (team) {
            res.send(team)
        }
    })

    server.get('api/players', function(req, res){
        var team = req.params.team
        team = App.Contestants[team]
        if (team) {
            res.send(App.Players)
        }
    })
    server.listen(8080);
})
