inputStub = "clarke"
isps = ["Shentel", "Viasat", "Hughesnet", "Comcast", "Verizon", "CenturyLink"]

with open(inputStub + "OutGEO.csv", "r") as f:
    geoLines = f.readlines()
    geoLines.sort()
    geoLines = [line.strip().split(",") for line in geoLines]
    
with open(inputStub + "OutIMA.csv", "r") as f:
    imaLines = f.readlines()
    imaLines.sort()
    imaLines = [line.strip().split(",") for line in imaLines]

with open("zipOutput.csv", "r") as f:
    hsiLines = [line.strip().split(",") for line in f.readlines()]
    hsiLines = [line for line in hsiLines if line[2].strip().lower() == inputStub]
    hsiLines = {line[0]:line[3:] for line in hsiLines}

with open(inputStub + "In.csv", "r") as f:
    addressLines = f.readlines()
    addressLines.sort()
    addressLines = [line.strip().split(",") for line in addressLines]    


with open(inputStub + "Results.csv", "w") as f:
    resList = []
    header = ["STREET", "CITY", "STATE", "ZIP", "COUNTY", "ISP", "SERVICE"]
    resList.append(header)
    
    for index in range(len(addressLines)):
        address = addressLines[index]
        geo = geoLines[index]
        ima = imaLines[index]
        zipCode = address[3]
        hsi = hsiLines[zipCode] if zipCode in hsiLines else []
        if geo[0] != address[0] or ima[0] != address[0]:
            print address[0] + "missing GEO or IMA"
        else:
            res = {}
            geo = [item.strip().lower() for item in geo[4:]]
            ima = [item.strip().lower() for item in ima[4:]]
            hsi = [item.strip().lower() for item in hsi]
            for isp in isps:
                isp = isp.lower()
                geoMatch = [item for item in geo if isp in item]
                imaMatch = [item for item in ima if isp in item]
                hsiMatch = [item for item in hsi if isp in item]

                if isp == 'centurylink':
                    geoMatch = geoMatch + [item for item in geo if 'level 3' in item]
                
                count = 0
                service = ""
                if geoMatch != []:
                    count = count + 1
                    if "F" not in service:
                        service = (service + "F") if ([item for item in geoMatch if "fiber" in item] != []) else service
                    if "C" not in service:
                        service = (service + "C") if ([item for item in geoMatch if "cable" in item] != []) else service
                    
                if imaMatch != []:
                    count = count + 1
                    if "F" not in service:
                        service = (service + "F") if ([item for item in imaMatch if "fiber" in item] != []) else service
                    if "C" not in service:
                        service = (service + "C") if ([item for item in imaMatch if "cable" in item] != []) else service

                if hsiMatch != [] and count > 0:
                    count = count + 1
                    
                if count > 0 and service != "":
                    res[isp] = [service, count]
                
            resKeys = res.keys()
            resKeys.sort()
            resFinal = []
            for key in resKeys:
                resFinal = resFinal + [key.capitalize(), res[key][0], str(res[key][1])]
            result = address + [inputStub.capitalize()] + resFinal
            if resFinal != []:
                resList.append(result)
    resList = [",".join(line) for line in resList]
    output = "\n".join(resList)
    f.write(output)
    f.close()
    
