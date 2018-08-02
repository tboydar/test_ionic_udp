import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
import { Platform } from 'ionic-angular';
import {ChangeDetectorRef} from '@angular/core';


declare var chrome;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private socketid: number;
  // private udpstream: BehaviorSubject<Object> = new BehaviorSubject({});
  // private udpstream: Subject<Object> = new BehaviorSubject({});
  udpstream = new Subject();


  debug_info = 'debug_info';

  constructor(public navCtrl: NavController, public plt: Platform,private ref:ChangeDetectorRef) {
    this.plt.ready().then(() => {
      this.udpSetup();
    });
  }
  

  udpSetup() {
    this.udpstream.subscribe((mdata: any) => {
      this.debug_info += ' udpstream ';
      this.debug_info += this.ab2str(mdata.data);
      this.ref.detectChanges();
    });

    chrome.sockets.udp.onReceive.addListener(info => {
      this.udpstream.next(info);
    });

    chrome.sockets.udp.onReceiveError.addListener(error => {
      console.log('Recv  ERROR from socket: ', error);
      this.udpstream.next({ error: error });
    });

    chrome.sockets.udp.create({}, socketInfo => {
      var socketId = socketInfo.socketId;
      console.log(socketId);
      this.debug_info += ' socketId' + socketId;

      chrome.sockets.udp.bind(socketId, '0.0.0.0', 8888, bind_code => {
        console.log('bind: ' + bind_code);

        chrome.sockets.udp.send(
          socketId,
          this.str2ab('from ionic'),
          '255.255.255.255',
          8888,
          sendInfo => {
            console.log('sent ' + sendInfo.bytesSent);
            console.log('sent_code ' + sendInfo.resultCode);
          }
        );

        //  setTimeout(() => {
        //   this.closeUDPService();
        // }, 2000);
      });
    });

    this.debug_info += ' ' + typeof chrome.sockets + '_';
  }

  closeUDPService() {
    if (typeof chrome.sockets !== 'undefined')
      chrome.sockets.udp.close(this.socketid);
    this.udpstream.complete();
  }

  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }
  str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}
