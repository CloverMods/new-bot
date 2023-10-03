{ pkgs }: {
  deps = [
    pkgs.unzip
    pkgs.nodejs-16_x
    pkgs.yarn
    pkgs.bashInteractive
    pkgs.nodePackages.bash-language-server
    pkgs.man
  ];
}