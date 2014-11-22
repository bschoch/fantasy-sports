var fs = require('fs')
var q = require('q')
var express = require('express')
var _ = require('underscore')
  , path = require('path')

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
    App.Stats = ["passing_yds","rushing_yds","receiving_yds","receiving_rec","passing_tds","rushing_tds","receiving_tds"]
    App.Plays = []
    var promises = []

    App.Contestants = {
        "Bradley": {
            "name": "Bradley"
            , "roster": []
        },
        "Charlie": {
            "name": "Charlie"
            , "roster" : []
        },
        "Jackie": {
            "name": "Jackie"
            , "roster": []
        },
        "Will": {
            "name": "Will"
            , "roster": []
        }
    }

    App.ContestantsSimulated = {}

    var gamePromise = q.defer()
    promises.push(gamePromise.promise)
    fs.readFile(path.join(__dirname, 'game_list_week_11.csv'), 'utf8', function(err, data) {
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
    fs.readFile(path.join(__dirname, 'player_list_week11.csv'), 'utf8', function(err, data) {
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
                contestant.roster.push(App.PlayersPositions.QB[randomIndex])
                App.PlayersPositions.QB.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.QB.push(contestant.roster[contestant.roster.length-1])

                // pick 1 TE
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.TE.length))
                contestant.roster.push(App.PlayersPositions.TE[randomIndex])
                App.PlayersPositions.TE.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.TE.push(contestant.roster[contestant.roster.length-1])

                // pick 2 RB
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.RB.length))
                contestant.roster.push(App.PlayersPositions.RB[randomIndex])
                App.PlayersPositions.RB.splice(randomIndex, 1)

                randomIndex = Math.floor((Math.random() * App.PlayersPositions.RB.length))
                contestant.roster.push(App.PlayersPositions.RB[randomIndex])
                App.PlayersPositions.RB.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.RB.push(contestant.roster[contestant.roster.length-2])
                App.PlayersPositions.RB.push(contestant.roster[contestant.roster.length-1])

                // pick 2 WR
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.WR.length))
                contestant.roster.push(App.PlayersPositions.WR[randomIndex])
                App.PlayersPositions.WR.splice(randomIndex, 1)

                randomIndex = Math.floor((Math.random() * App.PlayersPositions.WR.length))
                contestant.roster.push(App.PlayersPositions.WR[randomIndex])
                App.PlayersPositions.WR.splice(randomIndex, 1)

                // restore players
                App.PlayersPositions.WR.push(contestant.roster[contestant.roster.length-2])
                App.PlayersPositions.WR.push(contestant.roster[contestant.roster.length-1])

                App.ContestantsSimulated[contestant.name] = _.clone(contestant, true)
                App.ContestantsSimulated[contestant.name].time = 0
                App.Stats.forEach(function(stat) {
                    App.ContestantsSimulated[contestant.name][stat] = "0"
                })
            }

        playerPromise.resolve(true)

    })

    var playsPromise = q.defer()
    promises.push(playsPromise.promise)
    fs.readFile(path.join(__dirname, 'week11.csv'), 'utf8', function(err, data) {
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
    var start = new Date().getTime()
    var interval = 60 * 60 * 1000

    var server = express()
    server.get('/api/teams/:team', function(req, res){
        var team = req.params.team
        team = App.Contestants[team]
        if (team) {
            res.send(team)
        }
    })

    server.get('/teams/:team', function(req, res){
        var team = req.params.team
        team = App.Contestants[team]
        if (team) {
            res.send(team)
        }
    })

    function scoreTeam(team) {
        var score = 0
        return score
    }

    server.get('/api/teams/:team/poll', function(req, res){
        var team = req.params.team
        team = App.ContestantsSimulated[team]
        if (!team) {
            return
        }
        var now = new Date().getTime()
        var sinceStart = now - start
        var lastPoll = team.time
        var gameTime = 60 * (sinceStart / interval)
        var gameQuarter = Math.floor(gameTime / 15) + 1
        var quarterTime = gameTime % 15
        var lastPollGameTime = 60 * (lastPoll / interval)
        var lastPollQuarter = Math.floor(lastPollGameTime / 15) + 1
        var lastPollQuarterTime = lastPollGameTime % 15
        team.time = now

        var plays = []

        for (var i = 0; i < App.Plays.length; i += 1) {
            var play = App.Plays[i]
            var clockParts = play.clock.split(":")
            var clock = 15 - Number(clockParts[0])
            clock += (60 - Number(clockParts[1])) / 60
            if (play.qtr < lastPollQuarter || play.qtr === gameQuarter && clock < lastPollQuarterTime) {
                continue
            } else if (play.qtr > gameQuarter || play.qtr === gameQuarter && clock > quarterTime) {
                break
            }
            var player = App.Players[play.playerid]
            if (!player) {
                console.log("player not found" + play)
                continue
            }
            var teamPlayer = _.find(team[player.position], function(person) {
                return person.playerid === player.playerid
            })
            if (teamPlayer) {
                plays.push(play)
                App.Stats.forEach(function(stat) {
                    teamPlayer[stat] = Number(teamPlayer[stat]) + Number(play[stat])
                })
            }

        }

        team.score = scoreTeam(team)
        res.send({
            "team": team,
            "plays": plays,
            "standings": []
        })
    })
    server.listen(8080);
})
