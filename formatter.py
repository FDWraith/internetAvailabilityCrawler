stub = "clarke"

with open("zip.csv", "r") as f:
    lines = f.readlines()
    lines = [line.strip().split(",") for line in lines]
    zips = [line[0].strip() for line in lines]
    area = [line[1].strip() for line in lines]
    county = [line[2].strip() for line in lines]
    lines = []
    f.close()

def match_to_zip(zipCode):
    return area[zips.index(zipCode)] if zipCode in zips else ""

with open(stub + ".csv", "r") as f:
    lines = f.readlines()
    lines = [line.strip().split(",") for line in lines]

    header = lines[0]
    lines = lines[1:]

    LON = header.index('LON')
    LAT = header.index('LAT')
    NUMBER = header.index('NUMBER')
    STREET = header.index('STREET')
    UNIT = header.index('UNIT')
    CITY = header.index('CITY')
    DISTRICT = header.index('DISTRICT')
    REGION = header.index('REGION')
    ZIP = header.index('POSTCODE')

    #new_lines = [ ",".join([line[NUMBER] + " " + line[STREET] + "," + (line[CITY] if line[CITY] != "" else match_to_zip(line[ZIP])), "VA", line[ZIP]])
    #              for line in lines if line[NUMBER].strip() != "" and line[ZIP].strip() != ""]

    unique_addresses = {}
    
    for line in lines:
        line = [item.strip() for item in line]
        identifier = ",".join([line[STREET], (line[CITY] if line[CITY] != "" else match_to_zip(line[ZIP])), "VA", line[ZIP]])
        #print identifier
        if identifier not in unique_addresses:
            unique_addresses[identifier] = line[NUMBER]

    new_lines = [unique_addresses[identifier] + " " + identifier for identifier in unique_addresses.keys()]        
    
    f.close()

with open(stub + "In.csv", "w") as f:
    f.write("\n".join(new_lines))
    f.close()
