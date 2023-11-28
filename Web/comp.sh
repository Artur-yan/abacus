# Build script that compiles the react in production mode

export ASSET_PATH=`python3 /home/ubuntu/code/python/reainternal/environment.py loggedin_ui static_content_base_url`
node --max-old-space-size=4096 run build --release
