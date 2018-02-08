import requests
import json
import googlemaps

gmaps = googlemaps.Client(key='AIzaSyCcT7OEXqiOrf7YWQiPJ_VS9QhE5w9hhEY')

with open('clarke.csv','r') as f:
    lines = f.readlines()
    f.close()
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

with open('newClarke.csv', 'w') as f:
    withZips = [line for line in lines if line[ZIP] != "" and line[STREET] != "" and line[NUMBER] != "" and line[CITY] != ""]
    without = [line for line in lines if line not in withZips]

    f.write(",".join(header) + "\n")
    
    for line in withZips:
        #print line
        f.write(",".join(line) + "\n")

    
    errorChecker = False
    for line in without:
        if not errorChecker:
            try:
                response = gmaps.reverse_geocode((line[LAT], line[LON]))
                
                temp = response[0]['formatted_address'].split(',')
                temp = [item.strip() for item in temp]
            
                line[ZIP] = temp[2][3:]
                line[CITY] = temp[1]
                line[STREET] = " ".join(temp[0].split(" ")[1:]) if len(temp[0].split(" ")) >= 2 else temp[0].split(" ")[0] 
                line[NUMBER] = temp[0].split(" ")[0] if len(temp[0].split(" ")) >= 2 else ""
                print line

                f.write(",".join(line) + "\n")

            
            except:
                print "Timeout"
                f.write(",".join(line) + "\n")
                errorChecker = True
            
        else:
            f.write(",".join(line) + "\n")    
            
    
    f.close()

