document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:3000');
    let players = [];
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('ticketGenerated', (ticket) => {
      console.log('Generated Ticket:', ticket);
      displayTicket(ticket);
      enableClaimButtons();
      // document.getElementById('drawnNumbers').innerText = '';
    });

    socket.on('userJoined', (username) => {
      players.push(username);
      const playerList = document.getElementById('playerList');
      playerList.innerHTML = '';
      players.forEach(player => {
        playerList.innerHTML += `<p>${player}</p>`;
      });
    });

    socket.on('userLeft', (username) => {
      players.splice(players.indexOf(username), 1);
      const playerList = document.getElementById('playerList');
      playerList.innerHTML = '';
      players.forEach(player => {
        playerList.innerHTML += `<p>${player}</p>`;
      });
    });

    socket.on('joinedUsers', (users) => {
      const joinedUsers = document.getElementById('playerList');
      players = users;
      users.forEach(username => {
        joinedUsers.innerHTML += `<p>${username}</p>`;
      });
    });

    socket.on('winnerAnnounced', ({ username, claimType }) => {
      announcement(`Winner announced! ${username} claimed ${claimType}`);
      const winners = document.getElementById('winners');
      winners.innerHTML += `<p>${username} claimed ${claimType}</p>`;
    });

    socket.on('numberDrawn', (num) => {
      console.log('Number drawn:', num);
      announcement('Number '+ num);
      displayDrawnNumber(num);
    });

    socket.on('gameStarted', () => {
      document.getElementById('drawnNumbers').innerText = '';
    });

    socket.on('socketErr', (data) => {
      announcement(data.message);
      alert(data.message);
    });

    document.getElementById('joinGame').addEventListener('click', () => {
      const username = document.getElementById('username').value;
      if (username) {
        socket.emit('enterUsername', username);
        document.getElementById('username').disabled = true;
        document.getElementById('joinGame').disabled = true;
      } else {
        alert('Please enter a username');
      }
    });

    const claimButtons = ['FirstRow', 'SecondRow', 'ThirdRow', 'FirstFive', 'FullHouse'];
    claimButtons.forEach(claimType => {
      document.getElementById(`claim${claimType}`).addEventListener('click', () => {
        const username = document.getElementById('username').value;
        socket.emit('claimTicket', { username, claimType: claimType });
      });
    });

    document.getElementById('startGame').addEventListener('click', () => {
      fetch('/game/start', { method: 'POST' });
    });

    document.getElementById('drawNumber').addEventListener('click', () => {
      fetch('/game/draw', { method: 'POST' });
    });

    function displayTicket(ticket) {
      const table = document.createElement('table');
      ticket.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(num => {
          const td = document.createElement('td');
          if (num === '_') {
            td.classList.add('empty');
            td.innerText = ' ';
          } else {
            td.innerText = num;
            td.addEventListener('click', () => markCell(td));
            td.addEventListener('dblclick', () => unmarkCell(td));
          }
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      document.getElementById('ticket').innerHTML = '';
      document.getElementById('ticket').appendChild(table);
    }

    function markCell(cell) {
      cell.classList.add('marked');
    }

    function unmarkCell(cell) {
      cell.classList.remove('marked');
    }

    function enableClaimButtons() {
      claimButtons.forEach(claimType => {
        document.getElementById(`claim${claimType}`).disabled = false;
      });
    }

    function announcement(msg) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
    }

    function displayDrawnNumber(num) {
      const drawnNumbersDiv = document.getElementById('drawnNumbers');
      const span = document.createElement('span');
      span.innerText = num + ' ';
      span.style.fontWeight = 'bold';
      drawnNumbersDiv.appendChild(span);
    }
  });