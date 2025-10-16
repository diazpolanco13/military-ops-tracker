#!/bin/bash
cd /root/app-mapas
npx serve dist -s -l tcp://0.0.0.0:8080 -n
