import csv
import requests
import json
import time

with open('.data/librariesgeo.csv', 'r') as libscsv:
    reader = csv.reader(libscsv, delimiter=',', quotechar='"')
    next(reader, None)  # skip the headers
    writer = csv.writer(open('../data/librariesgeo_done.csv', 'w', encoding='utf8', newline=''), delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(['id', 'lat', 'lng'])

    for row in reader: # each row is in the format:  id, name, address, postcode, bbox, lat, lng
        id = row[0]
        name = row[1]
        address = row[2]
        postcode = row[3]
        bbox = row[4]
        bb = bbox.replace('POLYGON((', '').replace('))', '').split(',')
        bboxstr = bb[0].split(' ')[0] + ',' + bb[1].split(' ')[1] + ',' + bb[2].split(' ')[0] + ',' + bb[0].split(' ')[1]
        address = address.strip().replace(',',' ').replace(' ','+').replace('++','+')
        url = 'http://nominatim.openstreetmap.org/search/' + address + '?viewbox=' + bboxstr + '&format=json&bounded=1&limit=1'
        # url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + address + '.json?bbox=' + bboxstr + '&access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A'
        print(url)
        # request are like:  http://nominatim.openstreetmap.org/search/York+Explore+Library+Square+York?viewbox=-1.22371196679726,54.0568663596222,-0.919670778852277,53.8745672170754&format=json&bounded=1&limit=1
        result = requests.get(url).json()
        data = result['results']
        if len(data) > 0:
            writer.writerow([id,data[0]['geometry']['location']['lat'],data[0]['geometry']['location']['lng']])
            time.sleep(1) # because the web service is rate limited, wait for a second before moving onto the next one.
        else:
            writer.writerow([id, '', ''])
