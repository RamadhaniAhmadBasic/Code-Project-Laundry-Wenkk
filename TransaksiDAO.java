package org.example.Model;


import com.zaxxer.hikari.HikariDataSource;
import org.example.Util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TransaksiDAO {
    private HikariDataSource dataSource;

    public TransaksiDAO() {
        this.dataSource = DatabaseUtil.getDataSource();
    }

    public boolean simpanTransaksi(Transaksi transaksi) throws SQLException {
        String query = "INSERT INTO transaksi (id_pelanggan, nama_pelanggan, berat, jumlah, layanan, total_harga, bayar, kembalian) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, transaksi.getIdPelanggan());
            stmt.setString(2, transaksi.getNamaPelanggan());
            stmt.setInt(3, transaksi.getBerat());
            stmt.setInt(4, transaksi.getJumlah());
            stmt.setString(5, transaksi.getLayanan());
            stmt.setInt(6, transaksi.getTotalHarga());
            stmt.setInt(7, transaksi.getBayar());
            stmt.setInt(8, transaksi.getKembalian());

            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        }
    }

    public List<Transaksi> getAllTransaksi() throws SQLException {
        List<Transaksi> transaksiList = new ArrayList<>();
        String query = "SELECT * FROM transaksi";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Transaksi transaksi = new Transaksi();
                transaksi.setIdPelanggan(rs.getString("id_pelanggan"));
                transaksi.setNamaPelanggan(rs.getString("nama_pelanggan"));
                transaksi.setBerat(rs.getInt("berat"));
                transaksi.setJumlah(rs.getInt("jumlah"));
                transaksi.setLayanan(rs.getString("layanan"));
                transaksi.setTotalHarga(rs.getInt("total_harga"));
                transaksi.setBayar(rs.getInt("bayar"));
                transaksi.setKembalian(rs.getInt("kembalian"));

                transaksiList.add(transaksi);
            }
        }
        return transaksiList;
    }
}
