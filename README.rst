RTC Tic Tac Toe
==============================================

This is an example of using Web RTC data channels to play a game. One interesting
piece of this example is that it does not use a signalling server. Instead the
links to form the connection should be passed by some other medium (email, IM, IRC).

The demo application can be seen at: http://caktus.github.io/rtc-demo/

It currently requires the latest Firefox (24+) to run.


How To Play
----------------------------------------------

One person creates a new game by visiting http://caktus.github.io/rtc-demo/. On
the page they will be given a link to copy and share with the person they want to
play.

The other player clicks on the link which will show them a page with another link
to pass back to the original player. Once the original player clicks the link, the
two browsers will establish the RTC connection and the game will start.

Note: the links which are exchanged are very long. The first link with contain a
hash beginning with ``#offer-`` and the response link will have a hash beginning
with ``#answer-``. Beyond that there is very litte human readable content in the link.


Acknowledgements
----------------------------------------------

This was largely based on the serverless RTC example by Chris Ball 
https://github.com/cjb/serverless-webrtc which was rewritten using Backbone.


License
----------------------------------------------

This example is available for use and modification under the BSD license. It includes
versions of jQuery (under MIT), Backbone (under MIT), Underscore (under MIT) and
adapter.js from webrtc-experiments (under MIT). The original code was based on
serverless-webrtc (under MIT).