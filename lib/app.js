var fs = require('fs')
    , q = require('q')
    , express = require('express')
    , _ = require('underscore')
    , path = require('path')
    , App = {}

function start() {
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

    var names = [
    'charlie',
    'geoff',
    'michaeldunn',
    'mettinger',
    'nate',
    'jackie',
    'gaetano',
    'wade',
    'mike',
    'alex',
    'wfaught',
    'ben',
    'david',
    'thor',
    'nick',
    'steve',
    'max',
    'william',
    'tony',
    'tcooper',
    'michael',
    'bsmith',
    'chris',
    'mleow',
    'mariano',
    'bradley',
    'bryce',
    'charles',
    'heidi',
    'rishi',
    'ryan',
    'tyke',
    'dfusco',
    'stratos']

    App.Contestants = {}

    names.forEach(function(name) {
        App.Contestants[name] = {
            'name': name
          , 'roster': []
        }
    })

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
                        Object.keys(App.Stats).forEach(function(stat) { // dont want end game player stats, will retrieve as part of simulation
                            player[stat] = 0
                        })
                        App.Players[player.playerid] = player
                        App.PlayersPositions[player.position].push(JSON.parse(JSON.stringify(player)))
                    }
                }
            }
        })

        for (var contestant in App.Contestants) {
            if (App.Contestants.hasOwnProperty(contestant)) {
                var randomIndex, player
                contestant = App.Contestants[contestant]
                // pick 1 QB
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.QB.length))
                player = App.PlayersPositions.QB[randomIndex]
                contestant.roster.push(JSON.parse(JSON.stringify(player)))

                // pick 1 TE
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.TE.length))
                player = App.PlayersPositions.TE[randomIndex]
                contestant.roster.push(JSON.parse(JSON.stringify(player)))

                // pick 2 RB
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.RB.length))
                player = App.PlayersPositions.RB[randomIndex]
                contestant.roster.push(JSON.parse(JSON.stringify(player)))
                App.PlayersPositions.RB.splice(randomIndex, 1)

                randomIndex = Math.floor((Math.random() * App.PlayersPositions.RB.length))
                contestant.roster.push(JSON.parse(JSON.stringify(App.PlayersPositions.RB[randomIndex])))

                // restore players
                App.PlayersPositions.RB.push(player)

                // pick 2 WR
                randomIndex = Math.floor((Math.random() * App.PlayersPositions.WR.length))
                player = App.PlayersPositions.WR[randomIndex]
                contestant.roster.push(JSON.parse(JSON.stringify(player)))
                App.PlayersPositions.WR.splice(randomIndex, 1)

                randomIndex = Math.floor((Math.random() * App.PlayersPositions.WR.length))
                contestant.roster.push(JSON.parse(JSON.stringify(App.PlayersPositions.WR[randomIndex])))

                // restore players
                App.PlayersPositions.WR.push(player)
            }
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
                playsCsv = playsCsv.split("\t")
                if (index === 0) {
                    playsCsv.forEach(function(fieldName) {
                        fieldNames.push(fieldName)
                    })
                } else {
                    var play = {}
                    fieldNames.forEach(function(fieldName, index) {
                        play[fieldName] = playsCsv[index]
                    })
                    App.Plays.push(play)
                }
            }
        })
        playsPromise.resolve(true)
    });

    return q.all(promises)
}

start().then(function() {
    var start = new Date().getTime()
        , minutes = 10
        , server = express()

    function scoreTeam(team) {
        var score = 0
        clearStats(team)
        team.roster.forEach(function(player) {
            Object.keys(App.Stats).forEach(function(stat) {
                team[stat] += Number(player[stat])
            })
        })
        Object.keys(App.Stats).forEach(function(stat) {
            score += team[stat] * App.Stats[stat]
        })
        team.score = score
    }

    function scorePlayer(player) {
        var score = 0
        Object.keys(App.Stats).forEach(function(stat) {
            score += player[stat] * App.Stats[stat]
        })
        player.score = score
    }

    function clearRoster(roster) {
        roster.forEach(function(player) {
            Object.keys(App.Stats).forEach(function(stat) {
                player[stat] = 0
            })
        })
    }

    function clearStats(statObject) {
        Object.keys(App.Stats).forEach(function(stat) {
            statObject[stat] = 0
        })
    }

    server.get('/', function(req, res) {
        res.redirect('/jackie')
    })

    server.get('', function(req, res) {
        res.redirect('/jackie')
    })

    server.get('/api/teams/:team', function(req, res){
        var team = req.params.team
        team = App.Contestants[team]
        if (!team) {
            return
        }
        var now = new Date().getTime()
            , sinceStart = now - start
            , lastPoll = team.time
            , gameTime = (sinceStart / (minutes * 1000))
            , gameQuarter = Math.floor(gameTime / 15) + 1
            , quarterTime = gameTime % 15
            , plays = []
        team.time = sinceStart

        clearRoster(team.roster)
        for (var i = 0; i < App.Plays.length; i += 1) {
            var play = App.Plays[i]
                , clockParts = play.clock.split(":")
                , clock = 15 - Number(clockParts[0]) - 1
                , teamPlayer
            clock += (60 - Number(clockParts[1])) / 60
            if (Number(play.qtr) > gameQuarter || Number(play.qtr) === gameQuarter && clock > quarterTime) {
                break
            }
            teamPlayer = _.find(team.roster, function(person) {
                return person.playerid === play.playerid
            })
            if (teamPlayer) {
                plays.push(play)
                Object.keys(App.Stats).forEach(function(stat) {
                    teamPlayer[stat] += Number(play[stat])
                })
                scorePlayer(teamPlayer)
            }
        }
        scoreTeam(team)

        var standings = []
        for (var name in App.Contestants) {
            if (App.Contestants.hasOwnProperty(name)) {
                var contestant = App.Contestants[name]
                clearRoster(contestant.roster)
                for (i = 0; i < App.Plays.length; i += 1) {
                    play = App.Plays[i]
                    clockParts = play.clock.split(":")
                    clock = 15 - Number(clockParts[0]) - 1
                    clock += (60 - Number(clockParts[1])) / 60
                    if (Number(play.qtr) > gameQuarter || Number(play.qtr) === gameQuarter && clock > quarterTime) {
                        break
                    }
                    teamPlayer = _.find(contestant.roster, function (person) {
                        return person.playerid === this.playerid
                    }.bind(play))
                    if (teamPlayer) {
                        Object.keys(App.Stats).forEach(function (stat) {
                            teamPlayer[stat] += Number(play[stat])
                        })
                    }
                }
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

    server.get('/:team', function(req, res){
        var page = {
            team: req.params.team
        }

        var indexHTML = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8')
        var templateHTML = _.template(indexHTML)
        var compiledHTML = templateHTML({page: JSON.stringify(page)})

        res.set('Content-Type', 'text/html')
        res.send(compiledHTML)
    })

    server.use(express.static(path.join(__dirname, '../src')))

    server.listen(8080)
    console.log('Server listening on 8080.')
})
