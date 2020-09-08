In your terminal:

<pre>
cd /path/to/where_you_want_this_to_be_stored
git clone https://github.com/genderev/assassin_server.git
flyctl init
flyctl deploy
</pre>

For <code> flyctl init </code>, the default configuration is to use the Dockerfile to install and listen on port 8080. 
If you want to install the server with default config, <strong><a href="https://docs.docker.com/get-docker/">install Docker</a></strong> and have the Docker daemon running while you deploy to fly.io. (If it's already on your computer, great!)

If you don't want to install with the default config, well...I can't tell you what to do. Go be free!
