import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, Model, useModel } from '../src/react-model-store';

interface Chat {
  readonly key: number;
  readonly user: string;
  readonly message: string;
}

function append(
  chats: Chat[],
  user: string,
  message: string,
  capacity: number
): Chat[] {
  message = message.trim();
  if (!message) {
    return chats;
  }
  const result: Chat[] = [];
  const len = chats.length;
  for (let i = len >= capacity ? len - capacity + 1 : 0; i < len; i++) {
    result.push(chats[i]);
  }
  result.push({ key: len ? chats[len - 1].key + 1 : 0, user, message });
  return result;
}

class RootModel extends Model {
  chats: Chat[] = [];

  onAddChat = this.event(
    (user: string, message: string) =>
      (this.chats = append(this.chats, user, message, 20))
  );
}

class ChatViewModel extends Model {
  root = this.consume(RootModelStore);
  chats = this.state(this.root.chats);

  addChat = (_user: string, _message: string) => (this.chats = this.root.chats);

  constructor() {
    super();
    this.addListener(this.root.onAddChat, this.addChat);
  }
}

class ChatRoomModel extends Model {
  root = this.consume(RootModelStore);
  chats = this.state<Chat[]>([]);
  isFocus: boolean;
  user: string;
  input = this.ref<HTMLInputElement>();

  addChat = (user: string, message: string) =>
    (this.chats = append(this.chats, user, message, 10));

  constructor(initialValue?: { user: string; focus: boolean }) {
    super();
    this.user = initialValue ? initialValue.user : 'Anonymous';
    this.isFocus = initialValue ? initialValue.focus : false;
    this.addListener(this.root.onAddChat, this.addChat);
  }

  get text(): string {
    return this.input.current!.value;
  }

  set text(value: string) {
    this.input.current!.value = value;
  }

  sendMessage = () => {
    this.root.onAddChat(`[${this.user}]`, this.text);
    this.text = '';
    this.input.current!.focus();
  };

  sendLocaslMessage = () => {
    this.addChat('$(local)', this.text);
    this.text = '';
    this.input.current!.focus();
  };

  onTextKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        this.sendLocaslMessage();
      } else {
        this.sendMessage();
      }
    }
  };

  protected onMount(): void {
    if (this.isFocus) {
      this.input.current!.focus();
    }
  }
}

const RootModelStore = createStore(RootModel);

const ChatDisplay = (props: { chats: Chat[] }) => (
  <div>
    <table>
      <thead>
        <tr>
          <th>user</th>
          <th>message</th>
        </tr>
      </thead>
      <tbody>
        {props.chats.map(chat => (
          <tr key={chat.key}>
            <td>{chat.user}</td>
            <td>{chat.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChatView = () => {
  const { chats } = useModel(ChatViewModel);
  return (
    <div>
      <p>Chat View</p>
      <ChatDisplay chats={chats} />
    </div>
  );
};

const ChatRoom = (props: {
  initialValue?: { user: string; focus: boolean };
}) => {
  const {
    chats,
    user,
    sendMessage,
    sendLocaslMessage,
    onTextKeyPress,
    input: textRef,
  } = useModel(ChatRoomModel, props.initialValue);
  const display = React.useMemo(() => <ChatDisplay chats={chats} />, [chats]);

  return (
    <div>
      <p>Chat Room: {user}</p>
      <div>
        <input ref={textRef} type='text' onKeyPress={onTextKeyPress} />
      </div>
      <div>
        <button onClick={sendMessage}>Send Message (Enter)</button>
      </div>
      <div>
        <button onClick={sendLocaslMessage}>
          Send Local Message (Shift + Enter)
        </button>
      </div>
      {display}
    </div>
  );
};

const App = () => {
  const style = { marginLeft: 10, marginRight: 10 };
  return (
    <div>
      {/* RootModelStore.Provider doesn't re-render, because RootModelStore has no state. */}
      <RootModelStore.Provider>
        <div>
          <div style={{ display: 'flex' }}>
            <div style={style}>
              <ChatRoom initialValue={{ user: 'Keisuke', focus: true }} />
            </div>
            <div style={style}>
              <ChatRoom />
            </div>
            <div style={style}>
              <ChatView />
            </div>
          </div>
        </div>
      </RootModelStore.Provider>
    </div>
  );
};

ReactDOM.render(
  <div>
    <h2>Chat Example</h2>
    <App />
  </div>,
  document.getElementById('root')
);
