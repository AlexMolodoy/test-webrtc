// pages/Room.js
import { useParams } from 'react-router-dom';

const Room = () => {
  const { id } = useParams();
  return <h1>Комната ID: {id}</h1>;
};

export default Room;
