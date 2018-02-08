with open("shenandoahOutGEO.csv", "r") as f:
    geoLines = [line.strip().split(",") for line in f.readlines()]
    geoLines = [line[0] for line in geoLines]

with open("shenandoahIn.csv", "r") as f:
    addressLines = [line.strip().split(",") for line in f.readlines()]

print [line for line in addressLines if line[0] not in geoLines ]

