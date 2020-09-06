<img alt="ASSASSIN" src="https://raw.githubusercontent.com/genderev/assassin/master/assets/assassin.jpeg">

<p align="center"> A database that hires web workers to kill render blocking operations 🔪</p>
<hr>

<h1> Why do we need a new database? </h1>
<p> <strong>TL;DR <em>no existing databases</em> are compatible with <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers">web workers</a>.</strong> (I've gone to the <a href="https://dbdb.io/">database of databases</a> trying to prove myself wrong.)</p>
<h2> What are web workers? </h2>
<p> <strong>TL;DR You can outsource JavaScript to web workers. </strong></p>
<p>Web workers allow you to run multi-threaded JavaScript. When you run JavaScript in parallel to the main thread, the main thread is free to respond to user input. Eliminate render blocking database transactions for good with Assassin. </p>
<h3> Can you explain web workers with a picture, please? </h3>
<p> Sure! Look at this visual explanation of web workers. </p>
<img alt="web worker diagram" src="">
