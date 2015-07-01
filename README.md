jmux
==

tmux config wrapper written in node.


build
--
```
make build
```

cli
--
```
jmux -c test.json
jmux -c test.json -n  # Just print the tmux command
```

config
--
```
{
  "title": "jmux",
  "root": "~/code/jmux",
  "windows": [
    {
      "title": "server",
      "layout": "even-horizontal",
      "panes": [
        "ls -la",
        "git status",
        "echo \"foo\""
      ]
    }
  ]
}
```
