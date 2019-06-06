import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  PureModel,
  createStore,
  Event,
  EventHandler,
  Accessor,
} from '../src/react-model-store';

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

class RootModel extends PureModel {
  private _chats: Chat[] = [];

  private readonly _addChatEvent: Event<[string, string]> = this.event(
    (user, message) => (this._chats = append(this._chats, user, message, 20))
  );

  readonly addChatEvent: EventHandler<[string, string]> = this.handler(
    this._addChatEvent
  );

  readonly addChat = (user: string, message: string) =>
    this._addChatEvent(user, message);

  get chats(): Chat[] {
    return this._chats;
  }
}

class ChatViewModel extends PureModel {
  private readonly _root: RootModel = this.use(RootStore);

  private readonly _chats: Accessor<Chat[]> = this.state(this._root.chats);

  private readonly _onAddChat = (_user: string, _message: string) =>
    this._chats(this._root.chats);

  constructor() {
    super();
    this.listen(this._root.addChatEvent, this._onAddChat);
  }

  get chats(): Chat[] {
    return this._chats();
  }
}

class ChatRoomModel extends PureModel {
  private readonly _root: RootModel = this.use(RootStore);

  private readonly _chats = this.state<Chat[]>([]);

  private readonly _isFocus: boolean;

  readonly user: string;

  readonly textRef = this.ref<HTMLInputElement>();

  private readonly _onAddChat = (user: string, message: string) =>
    this._chats(append(this.chats, user, message, 10));

  constructor(initialValue?: { user: string; focus: boolean }) {
    super();
    this.user = initialValue ? initialValue.user : 'Anonymous';
    this._isFocus = initialValue ? initialValue.focus : false;
    this.listen(this._root.addChatEvent, this._onAddChat);
  }

  get chats(): Chat[] {
    return this._chats();
  }

  get text(): string {
    return this.textRef.current!.value;
  }

  set text(value: string) {
    this.textRef.current!.value = value;
  }

  readonly sendMessage = () => {
    this._root.addChat(`[${this.user}]`, this.text);
    this.text = '';
    this.textRef.current!.focus();
  };

  readonly sendLocaslMessage = () => {
    this._onAddChat('$(local)', this.text);
    this.text = '';
    this.textRef.current!.focus();
  };

  readonly onTextKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        this.sendLocaslMessage();
      } else {
        this.sendMessage();
      }
    }
  };

  protected onMount(): void {
    if (this._isFocus) {
      this.textRef.current!.focus();
    }
  }
}

const RootStore = createStore(() => new RootModel());
const ChatViewStore = createStore(() => new ChatViewModel());
const ChatRoomStore = createStore(
  (initialValue?: { user: string; focus: boolean }) =>
    new ChatRoomModel(initialValue)
);

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
  const { chats } = ChatViewStore.use();

  return (
    <div>
      <p>Chat View</p>
      <ChatDisplay chats={chats} />
    </div>
  );
};

const ChatRoom = () => {
  const {
    chats,
    user,
    sendMessage,
    sendLocaslMessage,
    onTextKeyPress,
    textRef,
  } = ChatRoomStore.use();

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
      {/* RootStore.Provider doesn't re-render, because RootModel has no state. */}
      <RootStore.Provider>
        <div>
          <h1>Store Tree Example</h1>
          <div style={{ display: 'flex' }}>
            <div style={style}>
              <ChatRoomStore.Provider
                initialValue={{ user: 'Keisuke', focus: true }}
              >
                <ChatRoom />
              </ChatRoomStore.Provider>
            </div>
            <div style={style}>
              <ChatRoomStore.Provider>
                <ChatRoom />
              </ChatRoomStore.Provider>
            </div>
            <div style={style}>
              <ChatViewStore.Provider>
                <ChatView />
              </ChatViewStore.Provider>
            </div>
          </div>
        </div>
      </RootStore.Provider>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
