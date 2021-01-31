import json
import urllib.request

def loadFilings():
    fIndexJson = open('2013Index.json', 'r')
    indexJsonRaw = fIndexJson.read()
    indexJsonLoaded = json.loads(indexJsonRaw)
    filings = indexJsonLoaded['Filings2013']
    return filings

def downloadFiles(filings):
    for filing in filings:
        downloadFile(filing['URL'], filing['EIN'])

def downloadFile(url, ein):
    contents = urllib.request.urlopen(url).read()
    f2 = open(f'xmlFiles/{ein}.xml', 'w')
    f2.write(contents.decode("utf-8"))
    f2.close()

filings = loadFilings()
downloadFiles(filings)
