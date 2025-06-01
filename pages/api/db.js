import mysql from 'mysql2/promise';

export async function getConnection() {
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '120NKu418Szl,', // ← 替换为你的真实密码
    database: 'mybbs'
  });
}

export async function getPools() {
  return mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '120NKu418Szl,', // ← 替换为你的真实密码
    database: 'mybbs'
  });
}