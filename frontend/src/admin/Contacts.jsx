import React, { useEffect, useState } from "react";
import axios from "axios";
//import NavbarAdmin from "../components/NavbarAdmin";
import "../css/admin.css";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);

  const fetchContacts = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/admin/contacts");
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/admin/contacts/${id}`);
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div>
     
      <div className="admin-container">
        <h2>Contacts</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c._id}>
                <td>{c.full_name}</td>
                <td>{c.email}</td>
                <td>{c.message}</td>
                <td><button onClick={() => deleteContact(c._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Contacts;
