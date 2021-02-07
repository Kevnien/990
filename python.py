import json
import requests
import threading
from datetime import datetime
import os

global thread_count
thread_count = 0
global global_filings
global_filings = []
global download_start_time
download_start_time = datetime.now()
global threads
threads = list()
global filenames
filenames = list()
global current_year

def load_filings(index_filename):
    f_index_json = open(f'index_files/{index_filename}.json', 'r')
    index_json_raw = f_index_json.read()
    index_json_loaded = json.loads(index_json_raw)
    filings = index_json_loaded[index_filename]
    global global_filings
    global_filings = filings
    return filings

def seconds_passed(start_time):
    end_time = datetime.now()
    diff = end_time - start_time
    return diff.seconds

def download_files(filings):
    global threads
    filings_length = len(filings)
    for index, filing in enumerate(filings):
        cur_ein = filing['EIN']
        # start_time = datetime.now()
        # while (thread_count > 3):
        #     if (seconds_passed(start_time) > 60):
        #         print(f'waiting on download {cur_ein} exceeded threshold')
        print(f'start downloading filing {cur_ein} number {index} of {filings_length}')
        print(f'{seconds_passed(download_start_time)} seconds has passed')
        thread = threading.Thread(target = start_thread_download_file, args = (index,))
        # threads.append(thread)
        thread.start()
    # for index, thread in enumerate(threads):
    #     thread.join()
    #     print(f'thread number {index} of {filings_length} has finished')

def start_thread_download_file(index):
    global thread_count
    thread_count += 1
    cur_filing = global_filings[index]
    download_file(cur_filing['URL'], cur_filing['EIN'], index)
    thread_count -= 1

def download_file(url, ein, index):
    try:
        contents = requests.get(url).text
    except requests.exceptions.ConnectionError:
        print(f'connection refused, ein: {ein}, index: {index}')
        return
    filepath = f'{current_year}_xml_files/{ein}.xml'
    write_contents(contents, filepath)
    print(f'download number {index} has finished')
    filenames.append(filepath)

def download_index(index_year):
    index_download_start_time = datetime.now()
    print(f'Starting download of {index_year} index')
    index_url = f'https://s3.amazonaws.com/irs-form-990/index_{index_year}.json'
    index_contents = requests.get(index_url).text
    print('response received, writing to file')
    filepath = f'index_files/Filings{index_year}.json'
    write_contents(index_contents, filepath)
    print(f'Took {seconds_passed(index_download_start_time)} seconds to download index_files/Filings{index_year}.json')

def write_contents(contents, filepath):
    f2 = open(filepath, 'w')
    f2.write(contents)
    f2.close()

def download_index_files():
    for year in range(11, 21):
        download_index(f'20{year}')

def download_all_xml_files():
    global current_year
    download_index_files()
    for year in range(11, 21):
        current_year = f'20{year}'
        os.makedirs(f'{current_year}_xml_files')
        download_files(load_filings(f'Filings{current_year}'))

current_year = '2019'
download_index(current_year)
os.makedirs(f'{current_year}_xml_files')
filings = load_filings(f'Filings{current_year}')
download_files(filings)
