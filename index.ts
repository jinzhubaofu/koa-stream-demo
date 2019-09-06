import Koa from 'koa';
import { Readable } from 'stream';

const app = new Koa();

class CounterStream extends Readable {

  index: number;
  max: number;
  timer: NodeJS.Timeout | null;

  constructor(max: number = 10) {
    super();
    this.max = max;
    this.index = 0;
    this.timer = null;
  }

  start() {
    // 如果有 timer 那么就不再启动；
    if (this.timer || this.index >= this.max) {
      return;
    }
    console.log('start');
    this.tick();
  }

  tick = () => {
    console.log('tick');
    // 把当前值放到流里
    if (!this.push(`${this.index++}`, 'utf-8')) {
      // 如果不能再 push，那么就停止生成数据
      this.stop();
      return;
    }

    if (this.index < this.max) {
      // 如果计数还不够，那就隔一会儿再 tick 一下
      this.timer = setTimeout(this.tick, 1000);
    } else {
      // 如果计数到了，那就终止
      this.push(null);
    }
  }

  stop() {
    console.log('stop');
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  _read() {
    console.log('nothing to read...');
    setTimeout(() => {
      this.push('awsl');
      this.push(null);
    }, 3000);
    // this.start();
  }

  _destroy() {
    console.log('destroy');
    this.stop();
  }

}

app.use(ctx => {

  if (ctx.path !== '/') {
    ctx.status = 404;
    return;
  }

  const stream = new CounterStream();

  stream.on('error', () => {
    console.log('error');
  });

  stream.on('close', () => {
    console.log('close');
  });

  stream.on('end', () => {
    console.log('stream end');
  });

  ctx.req.on('error', () => {
    console.log('request broken');
  });

  ctx.status = 200;
  ctx.set('content-type', 'text/html');
  ctx.set('Transfer-Encoding', 'chunked');
  ctx.body = stream;

});

app.listen(8080, () => console.log('server started'));
