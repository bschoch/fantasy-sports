import nflgame
from pprint import pprint
import operator

games = nflgame.games(2014, week=11)

print "away,home"

for g in games:
    print g.away + "," + g.home