import nflgame
from pprint import pprint
import operator

games = nflgame.games(2014, week=11)
plays = nflgame.combine_plays(games)
plays = [p for p in plays if hasattr(p, 'time') and hasattr(p.time, '__dict__')]
quarter1 = [p for p in plays if hasattr(p, 'time') and hasattr(p.time, '__dict__') and (p.time.qtr == 1) ]
quarter2 = [p for p in plays if hasattr(p, 'time') and hasattr(p.time, '__dict__') and (p.time.qtr == 2) ]
quarter3 = [p for p in plays if hasattr(p, 'time') and hasattr(p.time, '__dict__') and (p.time.qtr == 3) ]
quarter4 = [p for p in plays if hasattr(p, 'time') and hasattr(p.time, '__dict__') and (p.time.qtr == 4) ]

quarter1 = sorted(quarter1, key=operator.attrgetter('time.clock'), reverse=True)
quarter2 = sorted(quarter2, key=operator.attrgetter('time.clock'), reverse=True)
quarter3 = sorted(quarter3, key=operator.attrgetter('time.clock'), reverse=True)
quarter4 = sorted(quarter4, key=operator.attrgetter('time.clock'), reverse=True)

plays = quarter1 + quarter2 + quarter3 + quarter4

print "qtr\tclock\tplayerid\tplayername\tdescription\tpassing_yds\trushing_yds\treceiving_yds\treceiving_rec\tpassing_tds\trushing_tds\treceiving_tds"

for p in plays:
    qtr = p.time.qtr
    clock = p.time.clock
    description = p.desc
    for e in p.events:
        try:
            passing_yds = str(e.get("passing_yds", "0"))
            rushing_yds = str(e.get("rushing_yds", "0"))
            receiving_yds = str(e.get("receiving_yds", "0"))
            receiving_rec = str(e.get("receiving_rec", "0"))
            passing_tds = str(e.get("passing_tds", "0"))
            rushing_tds = str(e.get("rushing_tds", "0"))
            receiving_tds = str(e.get("receiving_tds", "0"))
            if passing_yds != "0" or rushing_yds != "0" or receiving_yds != "0" or receiving_rec != "0" or passing_tds != "0" or rushing_tds != "0" or receiving_tds != "0":
                print str(qtr) + "\t" + str(clock) + "\t" + e.get("playerid", "") + "\t" + e.get("playername", "") + "\t" + description + "\t" + passing_yds + "\t" + rushing_yds + "\t" + receiving_yds + "\t" + receiving_rec + "\t" + passing_tds + "\t" + rushing_tds + "\t" + receiving_tds
        except:
            continue