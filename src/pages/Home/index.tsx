// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { socket } from "../../socket";

const Home = () => {
  console.log(socket)
  return <h1>Главная страница</h1>;
};

export default Home;

