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
    App.Stats = {"passing_yds" : 0.04 * 5,
                    "rushing_yds": 0.1 * 5,
                    "receiving_yds": 0.1 * 5,
                    "receiving_rec": 0.1 * 5,
                    "passing_tds": 4 * 5,
                    "rushing_tds": 6 * 5,
                    "receiving_tds": 6 * 5}
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

                Object.keys(App.Stats).forEach(function(stat) {
                    contestant[stat] = 0
                })

                //clone to simulated team
                App.ContestantsSimulated[contestant.name] = _.clone(contestant, true)
                App.ContestantsSimulated[contestant.name].time = 0
                Object.keys(App.Stats).forEach(function(stat) {
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

    server.use(express.static(path.join(__dirname, '../src')))

    server.get('/teams/:team', function(req, res){
        var page = {
            team: req.params.team
        }

        var indexHTML = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8')
        var templateHTML = _.template(indexHTML)
        var compiledHTML = templateHTML({page: JSON.stringify(page)})

        res.set('Content-Type', 'text/html')
        res.send(compiledHTML)
    })

    function scoreTeam(team) {
        var score = 0
        team.roster.forEach(function(player) {
            Object.keys(App.Stats).forEach(function(stat) {
                team[stat] = Number(team[stat])
                team[stat] += Number(player[stat])
            })
        })
        Object.keys(App.Stats).forEach(function(stat) {
            score += team[stat] * App.Stats[stat]
        })
        team.score = score
    }

    server.get('/api/teams/:team', function(req, res){
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
        team.time = sinceStart

        var plays = []

        for (var i = 0; i < App.Plays.length; i += 1) {
            var play = App.Plays[i]
            var clockParts = play.clock.split(":")
            var clock = 15 - Number(clockParts[0]) - 1
            clock += (60 - Number(clockParts[1])) / 60
            if (Number(play.qtr) < lastPollQuarter || Number(play.qtr) === gameQuarter && clock < lastPollQuarterTime) {
                continue
            } else if (play.qtr > gameQuarter || play.qtr === gameQuarter && clock > quarterTime) {
                break
            }
            var teamPlayer = _.find(team.roster, function(person) {
                return person.playerid === play.playerid
            })
            if (teamPlayer) {
                plays.push(play)
                Object.keys(App.Stats).forEach(function(stat) {
                    teamPlayer[stat] = Number(teamPlayer[stat]) + Number(play[stat])
                })
            }
        }

        for (var name in App.Contestants) {
            if (App.Contestants.hasOwnProperty(name)) {
                var contestant = App.Contestants[name]
                for (var i = 0; i < App.Plays.length; i += 1) {
                    var play = App.Plays[i]
                    var clockParts = play.clock.split(":")
                    var clock = 15 - Number(clockParts[0])
                    clock += clock ? (60 - Number(clockParts[1])) / 60 : 0
                    if (clock > gameTime) {
                        break
                    }
                    var teamPlayer = _.find(contestant.roster, function (person) {
                        return person.playerid === play.playerid
                    })
                    if (teamPlayer) {
                        Object.keys(App.Stats).forEach(function (stat) {
                            teamPlayer[stat] = Number(teamPlayer[stat]) + Number(play[stat])
                        })
                    }
                }
            }
        }

        scoreTeam(team)
        var standings = []
        for (var name in App.Contestants) {
            if (App.Contestants.hasOwnProperty(name)) {
                var contestant = App.Contestants[name]
                scoreTeam(contestant)
                standings.push({"name": contestant.name, "score": contestant.score})
            }
        }

        standings.sort(function(a, b) {
            return b.score - a.score
        })

        res.send({
            "team": team,
            "plays": plays,
            "standings": standings
        })
    })
    server.listen(8080);
    console.log('Server listening on 8080.')
})
