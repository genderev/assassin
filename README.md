<img alt="ASSASSIN" src="https://raw.githubusercontent.com/genderev/assassin/master/assets/assassin.png">



![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)
![GitHub license1](https://img.shields.io/github/languages/top/genderev/assassin)
![GitHub license](https://img.shields.io/github/issues-pr-closed-raw/genderev/assassin)
![GitHub license2](https://img.shields.io/github/languages/code-size/genderev/assassin)
![GitHub license31](https://img.shields.io/github/issues/genderev/assassin)
![GitHub license3](https://img.shields.io/github/issues-pr/genderev/assassin)
![GitHub license4](https://img.shields.io/github/contributors/genderev/assassin)
![GitHudk](https://img.shields.io/gitter/room/genderev/assassin)








<h1> Why do we need a new database? </h1>
<p> <strong>TL;DR <em>no existing databases</em> are compatible with <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers">web workers</a>.</strong> (I've gone to the <a href="https://dbdb.io/">database of databases</a> trying to prove myself wrong.)</p>
<h2> What are web workers? </h2>
<p> <strong>TL;DR You can outsource JavaScript to web workers. </strong></p>
<p>Web workers allow you to run multi-threaded JavaScript. When you run JavaScript in parallel to the main thread, the main thread is free to respond to user input. Eliminate render blocking database transactions for good with Assassin. </p>
<h3> Can you explain web workers with a picture, please? </h3>
<p>You can see in the diagram that without web workers (that's the "before" part of the picture), the main thread has to finish processing all JavaScript before responding to user input. With the use of web workers (that's the "after" part of the picture), the main thread can send JavaScript to web workers and then focus on updating the UI.</p>
<img alt="web worker diagram" src="https://raw.githubusercontent.com/genderev/assassin/master/assets/diagram.png">

<h3>
  Features 💥
</h3>

<p>💫&nbsp;<strong> Lightweight</strong>: Shipped with less than 100 lines of client side code. </p>

<p>⚖️&nbsp;<strong> Decentralized</strong>: Your database has no single point of failure. If the server goes down, your data is easy to retrieve. </p>

<p>⚖️&nbsp;<strong> Works in private browsing</strong>: I researched databases like LevelDB, PouchDB, and Gun, which rely on <a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API">IndexedDB</a> for client-side storage. I wanted these databases to be effective, but I ended up creating this database partly because <a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API">IndexedDB</a> is disabled in private browsing, which means none of these databases work for me. </p> 

<p><strong>Methods:</strong></p>

<ul>
<li>
  <code>killer.connect(url)</code> - Connect to the server. <code>url</code> refers to the url of the server. You put the server's url into this this function.</li>
<li>
<code>killer.create(key,value)</code> - Add an entry to the database.</li>
<li>
<code>killer.update(key,new value)</code> - Update the value of a key in the database.</li>
<li>
<code>killer.delete(key)</code> - Delete an entry in the database.</li>
<li>
<code>database</code> - Inside a web worker or the main thread, you can always access the database through the variable called <code>database</code>. </li></ul>

<h3> Get Started: Server </h3>
First, you need to make a <a href="https://fly.io/">fly.io</a> account. If you haven't already installed <a href="https://dev.to/skaytech/docker-fundamentals-2ibi">Docker</a>, <a href="https://docs.docker.com/get-docker/">install it</a> and have the daemon running while you deploy your server. To deploy your server, type this in your <a href="https://www.w3schools.com/whatis/whatis_cli.asp">terminal</a> and hit "Enter" after the end of each line.
<img alt="shell" src="https://raw.githubusercontent.com/genderev/assassin/master/assets/carbon(2).png">
You can also deploy your server to <a href="https://buddy.works">buddy.works</a> or <a href="https://begin.com/">begin.com</a> on your own, if you want.

<h3> Get Started: Browser </h3>

You can save this <a href="https://raw.githubusercontent.com/genderev/assassin/master/dist/assassin.js">file</a> or you can clone this repo and use <code>assassin.js</code> in the <code>dist</code> folder. <code>assassin.js</code> goes inside the web worker that the main thread posts messages to. You can see an example of to do this in the source code for the <a href="https://assassin-demo.surge.sh/">demo</a>.

<h3>Architecture:</h3>

<ul>

<li><strong>Data Model</strong>: Assassin is a key/value store that supports mapping a key to its corresponding value. </li>

<li><strong> System Architecture</strong>: The DAT protocol distributes and hosts data between many computers, so there is no one location where data is stored. Assassin relies on the the DAT protocol for data persistence. The metadata of the key-value pairs are stored in a distributed <a href="https://en.wikipedia.org/wiki/Trie">trie</a> structure.</li>

<li><strong>Isolation Levels</strong>: The isolation level is determined by the end user of the database. Assassin is designed to have a low <a href="https://en.wikipedia.org/wiki/Isolation_(database_systems)">isolation level</a>.</li>

<li><strong>Storage Model</strong>: Assassin sends data to the server, which then stores the metadata in the distributed file system <a href="https://github.com/hypercore-protocol/hyperdrive">Hyperdrive,</a> which is built on the DAT protocol. The data itself is distributed and hosted between multiple peers.</li>

</ul>

<h3>Why is it called Assassin?</h3><ul>
<li>My website currently uses the <a href="https://gun.eco/">Gun</a> database.</li> <li> Gun has many features I like and the founder is pretty nice. </li><li> <strong>Gun stopped working for me.</strong></li> 
<li>Gun's  storage adapter <a href="https://gun.eco/docs/RAD">RAD</a> relies on IndexedDB, which is <strong>disabled in private browsing</strong>. </li><li>Gun syncs data peer to peer through WebRTC, which <strong>doesn't function in web workers.</strong></li>
<li>Assassin is sort of (seriously, very little) like Gun but for web workers.</li><li> <strong>Gun + worker = Assassin</strong> 💥 </li></ul>



<h2>
  Demo 🚀 
</h2>

<p><a href="https://assassin-demo.surge.sh">https://assassin-demo.surge.sh</a></p>

<h4>
  Built with 🔧
</h4>

<ul>
<li>
<a href="https://github.com/hypercore-protocol/hyperdrive">Hyperdrive</a> - Thanks for distributed file storage!</li>
<li>HTML - For creating the web demo</li>
<li>CSS - For styling the web demo</li>
<li>JavaScript - For logic</li>
<li>
<a href="https://nodejs.org">Node.js</a> - To serve the logic</li>
</ul>

<h3>Make sure to share your opinion in:</h3>

<ul>
<li>the Assassin <a href="https://github.com/genderev/assassin/pulls">GitHub pull requests</a>
</li>
<li>the <a href="https://gitter.im/assassindb/community">Gitter server</a>
</li>
</ul>
     
<p>And if you really want to help make Assassin better, make a <a href="https://github.com/genderev/assassin/pulls">pull request</a>! I really want to Assassin to have these things, so make a <a href="https://github.com/genderev/assassin/pulls">pull request</a> showing how to add them:</p>
<ul>
  <li> User authentication </li>
  <li> Server encryption </li>
 </ul>
 

<p><strong>Assassin is open source, and always will be.</strong></p>

<h3>
  <strong>Support me on:</strong>
</h3>

<ul>

<li><strong><a href="https://ko-fi.com/assassindb">Ko-Fi</a></strong></li>


</ul>

<p>Star the repo, <a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Fgenderev%2Fassassin&text=Assassin%20works%20to%20kill%20slow%20database%20transactions.">Tweet</a>, and share among your friends, teams and contacts! 
